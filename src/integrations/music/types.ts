export type MusicSource = "spotify" | "apple-music" | "youtube-music" | "youtube";

/** Unified shape every music source normalises "what's playing" into. */
export interface NowPlayingData {
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  source: MusicSource;
}
