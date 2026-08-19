import { MusicProviderId, NowPlayingData } from "./types";

/**
 * Pluggable now-playing source. `implemented: false` providers exist so the
 * widget can list all four services ROADMAP.md names and explain — rather
 * than silently omit — why each one isn't wired up yet; see spotify.ts vs.
 * appleMusic.ts/youtubeMusic.ts/youtube.ts for the reasoning per provider.
 * systemMedia.ts is the odd one out: it isn't one of ROADMAP.md's named
 * services at all, but a generic OS-media-session reader that works with
 * any of them (and anything else playing audio) with zero setup — see its
 * doc comment for why that's a better answer to "add more music sources"
 * than chasing each service's proprietary API one at a time.
 */
export interface MusicProvider {
  id: MusicProviderId;
  label: string;
  implemented: boolean;
  unavailableReason?: string;
  /**
   * Whether `connect()` needs the user to fill anything in first. When
   * false, the widget skips the connect-form step entirely and calls
   * `connect()` straight away — see systemMedia.ts (never needs config) and
   * spotify.ts (needs a Client ID only until `DEFAULT_SPOTIFY_CLIENT_ID` is
   * filled in) for the two ways this plays out.
   */
  needsConfig: boolean;
  isConnected(): Promise<boolean>;
  connect(config?: Record<string, string>): Promise<void>;
  disconnect(): Promise<void>;
  /** Returns null when connected but nothing is currently playing. Throws on a transient fetch/auth failure — callers should keep the last-known cached value rather than treating that as "nothing playing". */
  fetchNowPlaying(): Promise<NowPlayingData | null>;
}
