import { useEffect, useRef, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { MUSIC_PROVIDERS, MusicProvider, MusicProviderId, NowPlayingData } from "../../../integrations/music";
import { cacheNowPlaying, getActiveMusicProvider, getCachedNowPlaying, setActiveMusicProvider } from "../../../storage/music";
import "./Music.css";

const POLL_INTERVAL_MS = 10_000;

function providerById(id: MusicProviderId): MusicProvider {
  return MUSIC_PROVIDERS.find((p) => p.id === id)!;
}

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return "";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Music() {
  const [activeId, setActiveId] = useState<MusicProviderId | null>(null);
  const [connected, setConnected] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [showConnectForm, setShowConnectForm] = useState<MusicProviderId | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll(provider: MusicProvider) {
    try {
      const data = await provider.fetchNowPlaying();
      setNowPlaying(data);
      setDegraded(false);
      await cacheNowPlaying(provider.id, data);
    } catch (err) {
      console.error(`music poll failed for ${provider.id}`, err);
      setDegraded(true);
      const cached = await getCachedNowPlaying(provider.id);
      setNowPlaying(cached?.data ?? null);
    }
  }

  function startPolling(provider: MusicProvider) {
    if (pollRef.current) clearInterval(pollRef.current);
    poll(provider);
    pollRef.current = setInterval(() => poll(provider), POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }

  useEffect(() => {
    (async () => {
      const id = await getActiveMusicProvider();
      if (!id) return;
      const provider = providerById(id);
      const isConnected = await provider.isConnected();
      setActiveId(id);
      setConnected(isConnected);
      if (isConnected) startPolling(provider);
    })();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectProvider(provider: MusicProvider) {
    setError(null);
    if (!provider.implemented) {
      setShowConnectForm(null);
      return;
    }
    setShowConnectForm(provider.id);
  }

  async function connect(provider: MusicProvider) {
    setConnecting(true);
    setError(null);
    try {
      await provider.connect({ clientId: clientIdInput.trim() });
      await setActiveMusicProvider(provider.id);
      setActiveId(provider.id);
      setConnected(true);
      setShowConnectForm(null);
      startPolling(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to connect");
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (!activeId) return;
    const provider = providerById(activeId);
    stopPolling();
    await provider.disconnect();
    await setActiveMusicProvider(null);
    setActiveId(null);
    setConnected(false);
    setNowPlaying(null);
    setDegraded(false);
  }

  return (
    <WidgetFrame title="Music">
      <div className="music-widget">
        {connected && activeId ? (
          <>
            <div className="music-widget__now-playing">
              {nowPlaying ? (
                <>
                  {nowPlaying.artworkUrl ? (
                    <img className="music-widget__art" src={nowPlaying.artworkUrl} alt="" />
                  ) : (
                    <div className="music-widget__art music-widget__art--placeholder">♪</div>
                  )}
                  <div className="music-widget__info">
                    <span className="music-widget__title">{nowPlaying.trackTitle}</span>
                    <span className="music-widget__artist">{nowPlaying.artist}</span>
                    {nowPlaying.durationMs !== undefined && (
                      <div className="music-widget__progress">
                        <div
                          className="music-widget__progress-fill"
                          style={{ width: `${Math.min(100, ((nowPlaying.progressMs ?? 0) / nowPlaying.durationMs) * 100)}%` }}
                        />
                      </div>
                    )}
                    <span className="music-widget__time">
                      {formatMs(nowPlaying.progressMs)} / {formatMs(nowPlaying.durationMs)}
                      {!nowPlaying.isPlaying && " · paused"}
                    </span>
                  </div>
                </>
              ) : (
                <p className="music-widget__empty">Nothing playing on {providerById(activeId).label} right now.</p>
              )}
            </div>
            {degraded && <p className="music-widget__status">⚠ Offline — showing last-known state.</p>}
            <button className="music-widget__disconnect" onClick={disconnect}>
              Disconnect {providerById(activeId).label}
            </button>
          </>
        ) : (
          <div className="music-widget__providers">
            {MUSIC_PROVIDERS.map((p) => (
              <button
                key={p.id}
                className={`music-widget__provider ${!p.implemented ? "is-disabled" : ""}`}
                title={p.unavailableReason ?? `Connect ${p.label}`}
                onClick={() => selectProvider(p)}
              >
                {p.label}
                {!p.implemented && <span className="music-widget__soon">soon</span>}
              </button>
            ))}
          </div>
        )}

        {showConnectForm && (
          <div className="music-widget__connect-form">
            <input
              placeholder={`${providerById(showConnectForm).label} Client ID`}
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
            />
            {showConnectForm === "spotify" && (
              <p className="music-widget__hint">
                Create an app at developer.spotify.com, add redirect URI <code>http://127.0.0.1:42815/callback</code>, then
                paste its Client ID here.
              </p>
            )}
            <button disabled={connecting || !clientIdInput.trim()} onClick={() => connect(providerById(showConnectForm))}>
              {connecting ? "Connecting…" : "Connect"}
            </button>
          </div>
        )}

        {error && <p className="music-widget__error">{error}</p>}
      </div>
    </WidgetFrame>
  );
}
