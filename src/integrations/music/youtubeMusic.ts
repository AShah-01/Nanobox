import { MusicProvider } from "./provider";

const UNAVAILABLE_REASON =
  "ROADMAP.md named Odesli polling for this, but Odesli/song.link resolves a *known* track link across services " +
  "(e.g. \"here's this Spotify link, what's the YouTube Music equivalent\") — it has no concept of what's " +
  "currently playing on someone's account, so it can't drive a live now-playing widget by itself. There's also " +
  "no public YouTube Music \"now playing\" API to poll. A real implementation needs some other way to detect " +
  "what's playing first (e.g. reading the OS media-session info most platforms expose) before Odesli could even " +
  "be used for the cross-service link. Cut for this session, see PROGRESS.md Milestone 5 notes.";

/** Not implemented this session — see UNAVAILABLE_REASON. */
export const youtubeMusicProvider: MusicProvider = {
  id: "youtube-music",
  label: "YouTube Music",
  implemented: false,
  unavailableReason: UNAVAILABLE_REASON,
  needsConfig: true, // moot while `implemented` is false — never reaches the connect form
  async isConnected() {
    return false;
  },
  async connect() {
    throw new Error(UNAVAILABLE_REASON);
  },
  async disconnect() {},
  async fetchNowPlaying() {
    return null;
  },
};
