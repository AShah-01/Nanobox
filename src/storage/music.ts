import { getSetting, setSetting } from "./settings";
import { MusicProviderId, NowPlayingData } from "../integrations/music/types";

export async function getActiveMusicProvider(): Promise<MusicProviderId | null> {
  const value = await getSetting("music.activeProvider");
  return (value as MusicProviderId | "") || null;
}

export async function setActiveMusicProvider(id: MusicProviderId | null): Promise<void> {
  await setSetting("music.activeProvider", id ?? "");
}

interface CachedNowPlaying {
  data: NowPlayingData | null;
  cachedAt: string;
}

/** Last-known-good now-playing state, for graceful degradation when a poll fails. */
export async function cacheNowPlaying(id: MusicProviderId, data: NowPlayingData | null): Promise<void> {
  const entry: CachedNowPlaying = { data, cachedAt: new Date().toISOString() };
  await setSetting(`music.cache.${id}`, JSON.stringify(entry));
}

export async function getCachedNowPlaying(id: MusicProviderId): Promise<CachedNowPlaying | null> {
  const raw = await getSetting(`music.cache.${id}`);
  return raw ? JSON.parse(raw) : null;
}
