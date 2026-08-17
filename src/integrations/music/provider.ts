import { MusicProviderId, NowPlayingData } from "./types";

/**
 * Pluggable now-playing source. `implemented: false` providers exist so the
 * widget can list all four services ROADMAP.md names and explain — rather
 * than silently omit — why each one isn't wired up yet; see spotify.ts vs.
 * appleMusic.ts/youtubeMusic.ts/youtube.ts for the reasoning per provider.
 */
export interface MusicProvider {
  id: MusicProviderId;
  label: string;
  implemented: boolean;
  unavailableReason?: string;
  isConnected(): Promise<boolean>;
  connect(config?: Record<string, string>): Promise<void>;
  disconnect(): Promise<void>;
  /** Returns null when connected but nothing is currently playing. Throws on a transient fetch/auth failure — callers should keep the last-known cached value rather than treating that as "nothing playing". */
  fetchNowPlaying(): Promise<NowPlayingData | null>;
}
