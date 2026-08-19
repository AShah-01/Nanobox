import { MusicProvider } from "./provider";

const UNAVAILABLE_REASON =
  "MusicKit JS needs a developer token: a JWT signed with an Apple Developer Program private key (ES256). " +
  "That signing step can't happen safely in a pure client-side desktop app — the private key would have to ship " +
  "inside the binary, which defeats the point of it being a secret. A real implementation needs either a small " +
  "token-signing backend (which Nanobox, local-first and serverless, doesn't have) or a manual per-user " +
  "paste-your-own-token flow. Cut for this session, see PROGRESS.md Milestone 5 notes.";

/** Not implemented this session — see UNAVAILABLE_REASON. */
export const appleMusicProvider: MusicProvider = {
  id: "apple-music",
  label: "Apple Music",
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
