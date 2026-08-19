import { MusicProvider } from "./provider";
import { spotifyProvider } from "./spotify";
import { appleMusicProvider } from "./appleMusic";
import { youtubeMusicProvider } from "./youtubeMusic";
import { youtubeProvider } from "./youtube";
import { systemMediaProvider } from "./systemMedia";

export const MUSIC_PROVIDERS: MusicProvider[] = [
  systemMediaProvider,
  spotifyProvider,
  appleMusicProvider,
  youtubeMusicProvider,
  youtubeProvider,
];

export type { MusicProvider } from "./provider";
export type { MusicProviderId, NowPlayingData } from "./types";
