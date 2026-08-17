export type MusicProviderId = "spotify" | "apple-music" | "youtube-music" | "youtube";

/** Unified shape every music provider normalises its playback state into. */
export interface NowPlayingData {
  provider: MusicProviderId;
  isPlaying: boolean;
  trackTitle: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  progressMs?: number;
  durationMs?: number;
  /** Deep link to open the track in its native app/site. */
  url?: string;
}
