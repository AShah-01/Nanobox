import { getSecret, setSecret, deleteSecret } from "../secureStore";
import { OAuthTokens, refreshOAuthTokens, runOAuthPkceFlow } from "../oauth/pkce";
import { MusicProvider } from "./provider";

const REDIRECT_PORT = 42815;
const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SCOPE = "user-read-currently-playing user-read-playback-state";
const TOKENS_KEY = "spotify.tokens";

/** Register this exact URI as a redirect URI on the Spotify app in the Spotify Developer Dashboard. */
export const SPOTIFY_REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`;

interface StoredTokens extends OAuthTokens {
  clientId: string;
}

async function getValidAccessToken(): Promise<string | null> {
  const raw = await getSecret(TOKENS_KEY);
  if (!raw) return null;
  let stored: StoredTokens = JSON.parse(raw);

  if (stored.expiresAt - 60_000 > Date.now()) return stored.accessToken;
  if (!stored.refreshToken) return stored.accessToken;

  const refreshed = await refreshOAuthTokens({ tokenUrl: TOKEN_URL, clientId: stored.clientId }, stored.refreshToken);
  stored = { ...refreshed, clientId: stored.clientId };
  await setSecret(TOKENS_KEY, JSON.stringify(stored));
  return stored.accessToken;
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing: boolean;
  progress_ms: number | null;
  item: {
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    album: { name: string; images: { url: string }[] };
    external_urls: { spotify: string };
  } | null;
}

/**
 * Read-only "now playing" via polling `/me/player/currently-playing`,
 * deliberately not the Web Playback SDK ROADMAP.md mentions — that SDK
 * turns the app into a controllable playback *device* (streams audio,
 * needs Premium, needs a persistent player instance); this widget only
 * needs to display what's already playing somewhere else, which the
 * simpler read-only endpoint does without the extra complexity or the
 * Premium requirement.
 */
export const spotifyProvider: MusicProvider = {
  id: "spotify",
  label: "Spotify",
  implemented: true,

  async isConnected() {
    return (await getSecret(TOKENS_KEY)) !== null;
  },

  async connect(config) {
    const clientId = config?.clientId;
    if (!clientId) throw new Error("Spotify Client ID is required");
    const tokens = await runOAuthPkceFlow({
      authorizeUrl: AUTHORIZE_URL,
      tokenUrl: TOKEN_URL,
      clientId,
      scope: SCOPE,
      redirectPort: REDIRECT_PORT,
    });
    const stored: StoredTokens = { ...tokens, clientId };
    await setSecret(TOKENS_KEY, JSON.stringify(stored));
  },

  async disconnect() {
    await deleteSecret(TOKENS_KEY);
  },

  async fetchNowPlaying() {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return null;

    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`Spotify fetch failed: ${res.status}`);
    const json: SpotifyCurrentlyPlayingResponse = await res.json();
    if (!json.item) return null;

    return {
      provider: "spotify" as const,
      isPlaying: json.is_playing,
      trackTitle: json.item.name,
      artist: json.item.artists.map((a) => a.name).join(", "),
      album: json.item.album.name,
      artworkUrl: json.item.album.images[0]?.url,
      progressMs: json.progress_ms ?? undefined,
      durationMs: json.item.duration_ms,
      url: json.item.external_urls.spotify,
    };
  },
};
