import { secureDelete, secureGet, secureSet } from "../../storage/secureStore";
import { MusicSource, NowPlayingData } from "./types";

export interface MusicAdapter {
  id: MusicSource;
  label: string;
  /** Where a developer registers an app to get a client ID for this source. */
  setupUrl: string;
  credentialLabel: string;
  isConfigured(): Promise<boolean>;
  saveCredential(value: string): Promise<void>;
  clearCredential(): Promise<void>;
  /**
   * Not implemented yet — every adapter returns null. Real OAuth completion
   * (PKCE redirect capture for Spotify, MusicKit JS for Apple Music, Odesli
   * polling for YouTube Music, Data API v3 for YouTube) is the next step
   * once a client ID is saved. See ROADMAP.md Milestone 5.
   */
  getNowPlaying(): Promise<NowPlayingData | null>;
}

const SERVICE_PREFIX = "nanobox-music-";
const CLIENT_ID_KEY = "client_id";

function createAdapter(id: MusicSource, label: string, setupUrl: string, credentialLabel: string): MusicAdapter {
  const service = SERVICE_PREFIX + id;
  return {
    id,
    label,
    setupUrl,
    credentialLabel,
    async isConfigured() {
      return (await secureGet(service, CLIENT_ID_KEY)) !== null;
    },
    async saveCredential(value: string) {
      await secureSet(service, CLIENT_ID_KEY, value);
    },
    async clearCredential() {
      await secureDelete(service, CLIENT_ID_KEY);
    },
    async getNowPlaying() {
      return null;
    },
  };
}

export const MUSIC_ADAPTERS: Record<MusicSource, MusicAdapter> = {
  spotify: createAdapter("spotify", "Spotify", "https://developer.spotify.com/dashboard", "Client ID"),
  "apple-music": createAdapter(
    "apple-music",
    "Apple Music",
    "https://developer.apple.com/musickit/",
    "MusicKit developer token",
  ),
  "youtube-music": createAdapter("youtube-music", "YouTube Music", "https://odesli.co", "(uses YouTube's API key below)"),
  youtube: createAdapter("youtube", "YouTube", "https://console.cloud.google.com/apis/credentials", "API key"),
};
