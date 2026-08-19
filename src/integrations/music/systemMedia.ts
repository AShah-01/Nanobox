import { invoke } from "@tauri-apps/api/core";
import { MusicProvider } from "./provider";

/**
 * Reads whatever the OS's own media-session hub currently reports — the
 * same source the taskbar / lock-screen media controls read from — via the
 * `get_system_now_playing` Tauri command (see src-tauri/src/system_media.rs).
 *
 * This is deliberately not a per-service integration: it needs no client
 * ID, no OAuth consent screen, no developer-dashboard app registration —
 * nothing to configure. It works for whatever app currently holds the
 * system media session (Spotify desktop or web, YouTube Music in any
 * browser tab, the Apple Music app, VLC, ...), which is a far more
 * complete answer to "connect other music systems" than adding one more
 * single-service API integration would be.
 *
 * Windows-only for now — see the Rust module's doc comment for why macOS
 * doesn't have a safe public equivalent. `implemented` is computed from
 * the webview's platform at module load, so the widget simply doesn't
 * offer this provider (falls into the "soon" bucket like Apple Music /
 * YouTube Music) anywhere the underlying command can't work.
 */

function isWindows(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform || navigator.userAgent || "";
  return /win/i.test(platform);
}

const IMPLEMENTED = isWindows();

const UNAVAILABLE_REASON =
  "Reads the OS's native media-session info (Windows' System Media Transport Controls, same as the taskbar's " +
  "media flyout) — no public equivalent exists on this platform yet, so this provider is Windows-only for now.";

interface SystemNowPlayingResponse {
  title: string;
  artist: string;
  album?: string | null;
  isPlaying: boolean;
  positionMs?: number | null;
  durationMs?: number | null;
  artworkBase64?: string | null;
}

async function readSystemNowPlaying(): Promise<SystemNowPlayingResponse | null> {
  return invoke<SystemNowPlayingResponse | null>("get_system_now_playing");
}

export const systemMediaProvider: MusicProvider = {
  id: "system",
  label: "Now Playing (this device)",
  implemented: IMPLEMENTED,
  unavailableReason: IMPLEMENTED ? undefined : UNAVAILABLE_REASON,
  needsConfig: false,

  async isConnected() {
    // Nothing to authenticate or store — "connected" just means the user
    // has picked this provider as their active one, which Music.tsx tracks
    // itself via storage/music.ts. From this provider's point of view it's
    // always available once implemented.
    return IMPLEMENTED;
  },

  async connect() {
    if (!IMPLEMENTED) throw new Error(UNAVAILABLE_REASON);
    // No config to collect. Still probe the command once so a genuinely
    // broken environment (e.g. WinRT unavailable) fails fast with a clear
    // error here rather than silently on the first poll.
    try {
      await readSystemNowPlaying();
    } catch (err) {
      throw new Error(
        `Couldn't read the system media session: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  },

  async disconnect() {
    // Nothing persisted to clean up.
  },

  async fetchNowPlaying() {
    const data = await readSystemNowPlaying();
    if (!data || !data.title) return null;

    return {
      provider: "system" as const,
      isPlaying: data.isPlaying,
      trackTitle: data.title,
      artist: data.artist,
      album: data.album ?? undefined,
      artworkUrl: data.artworkBase64 ?? undefined,
      progressMs: data.positionMs ?? undefined,
      durationMs: data.durationMs ?? undefined,
    };
  },
};
