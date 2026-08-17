import { getSetting, setSetting } from "./settings";
import { MUSIC_PROVIDERS } from "../integrations/music";
import { MusicProviderId, NowPlayingData } from "../integrations/music/types";

/**
 * Validates the persisted value against the actual provider list rather
 * than trusting a raw string cast — an old build, a manual DB edit, or a
 * provider getting renamed/removed could otherwise leave an unrecognized
 * id here, which would crash Music.tsx's `providerById(id)!` on load.
 */
export async function getActiveMusicProvider(): Promise<MusicProviderId | null> {
  const value = await getSetting("music.activeProvider");
  const isValid = MUSIC_PROVIDERS.some((p) => p.id === value);
  return isValid ? (value as MusicProviderId) : null;
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
