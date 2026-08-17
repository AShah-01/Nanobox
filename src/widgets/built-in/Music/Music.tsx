import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { MUSIC_ADAPTERS } from "../../../integrations/music/adapters";
import { MusicSource, NowPlayingData } from "../../../integrations/music/types";
import "./Music.css";

const SOURCES = Object.keys(MUSIC_ADAPTERS) as MusicSource[];

export function Music() {
  const [active, setActive] = useState<MusicSource>("spotify");
  const [configured, setConfigured] = useState<Record<MusicSource, boolean>>({
    spotify: false,
    "apple-music": false,
    "youtube-music": false,
    youtube: false,
  });
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);

  const adapter = MUSIC_ADAPTERS[active];

  async function refreshConfigured() {
    const entries = await Promise.all(SOURCES.map(async (s) => [s, await MUSIC_ADAPTERS[s].isConfigured()] as const));
    setConfigured(Object.fromEntries(entries) as Record<MusicSource, boolean>);
  }

  useEffect(() => {
    refreshConfigured().catch((err) => console.error("failed to check music credentials", err));
  }, []);

  useEffect(() => {
    setEditing(false);
    setInput("");
    adapter.getNowPlaying().then(setNowPlaying);
  }, [active]);

  async function save() {
    if (!input.trim()) return;
    await adapter.saveCredential(input.trim());
    setInput("");
    setEditing(false);
    await refreshConfigured();
  }

  async function clear() {
    await adapter.clearCredential();
    await refreshConfigured();
  }

  return (
    <WidgetFrame title="Music">
      <div className="music-widget">
        <div className="music-widget__tabs">
          {SOURCES.map((s) => (
            <button
              key={s}
              className={active === s ? "is-active" : ""}
              onClick={() => setActive(s)}
              title={MUSIC_ADAPTERS[s].label}
            >
              {configured[s] ? "●" : "○"} {MUSIC_ADAPTERS[s].label}
            </button>
          ))}
        </div>

        <div className="music-widget__now-playing">
          {nowPlaying ? (
            <>
              <div className="music-widget__artwork" style={{ backgroundImage: `url(${nowPlaying.artworkUrl})` }} />
              <div className="music-widget__meta">
                <span className="music-widget__title">{nowPlaying.title}</span>
                <span className="music-widget__artist">{nowPlaying.artist}</span>
              </div>
            </>
          ) : (
            <div className="music-widget__placeholder">
              <span className="music-widget__note">♪</span>
              <span>{configured[active] ? "Nothing playing" : "Not connected"}</span>
            </div>
          )}
        </div>

        <div className="music-widget__config">
          {configured[active] && !editing ? (
            <div className="music-widget__configured">
              <span>{adapter.credentialLabel} saved ✓</span>
              <div className="music-widget__configured-actions">
                <button onClick={() => setEditing(true)}>Change</button>
                <button onClick={clear}>Remove</button>
              </div>
            </div>
          ) : (
            <div className="music-widget__form">
              <input
                placeholder={adapter.credentialLabel}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
              <button className="music-widget__save" onClick={save}>
                Save
              </button>
            </div>
          )}
          <button className="music-widget__setup-link" onClick={() => openUrl(adapter.setupUrl)}>
            Get a {adapter.credentialLabel.toLowerCase()} from {adapter.label} ↗
          </button>
          <p className="music-widget__hint">
            Live playback isn't wired up yet — this saves your credential securely in the OS keychain so it's ready
            once the connection lands.
          </p>
        </div>
      </div>
    </WidgetFrame>
  );
}
