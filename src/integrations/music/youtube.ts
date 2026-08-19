import { MusicProvider } from "./provider";

const UNAVAILABLE_REASON =
  "The YouTube Data API v3 is a content/catalog API (search, upload, playlists, stats) — it has no endpoint for " +
  "\"what is this signed-in user currently watching or listening to\", so it can't back a now-playing widget " +
  "however it's queried. Actually knowing what's playing would need browser-extension-level access to an open " +
  "YouTube tab, which is out of scope for a desktop widget backed by a plain OAuth API client. Cut for this " +
  "session, see PROGRESS.md Milestone 5 notes.";

/** Not implemented this session — see UNAVAILABLE_REASON. */
export const youtubeProvider: MusicProvider = {
  id: "youtube",
  label: "YouTube",
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
