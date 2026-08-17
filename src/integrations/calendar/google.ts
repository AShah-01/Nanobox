import { getSecret, setSecret, deleteSecret } from "../secureStore";
import { runOAuthPkceFlow, refreshOAuthTokens, OAuthTokens } from "../oauth/pkce";
import { CalendarEvent } from "./types";

const REDIRECT_PORT = 42813;
const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const TOKENS_KEY = "google.calendar.tokens";

/** Register this exact URI as the OAuth client's redirect URI in Google Cloud Console. */
export const GOOGLE_REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`;

interface StoredTokens extends OAuthTokens {
  clientId: string;
}

export async function connectGoogleCalendar(clientId: string): Promise<void> {
  const tokens = await runOAuthPkceFlow({
    authorizeUrl: AUTHORIZE_URL,
    tokenUrl: TOKEN_URL,
    clientId,
    scope: SCOPE,
    redirectPort: REDIRECT_PORT,
    // access_type=offline + prompt=consent so Google actually issues a refresh_token
    // (it otherwise only does this on a user's very first consent).
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  });
  const stored: StoredTokens = { ...tokens, clientId };
  await setSecret(TOKENS_KEY, JSON.stringify(stored));
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await deleteSecret(TOKENS_KEY);
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  return (await getSecret(TOKENS_KEY)) !== null;
}

async function getValidAccessToken(): Promise<string | null> {
  const raw = await getSecret(TOKENS_KEY);
  if (!raw) return null;
  let stored: StoredTokens = JSON.parse(raw);

  if (stored.expiresAt - 60_000 > Date.now()) {
    return stored.accessToken;
  }
  if (!stored.refreshToken) return stored.accessToken;

  const refreshed = await refreshOAuthTokens({ tokenUrl: TOKEN_URL, clientId: stored.clientId }, stored.refreshToken);
  stored = { ...refreshed, clientId: stored.clientId };
  await setSecret(TOKENS_KEY, JSON.stringify(stored));
  return stored.accessToken;
}

interface GoogleEventItem {
  id: string;
  summary?: string;
  location?: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

/**
 * Fetches events from the user's primary Google Calendar in [rangeStart,
 * rangeEnd]. Throws on network/auth failure — callers fall back to the last
 * cached copy (see storage/calendar.ts) rather than surfacing a blank widget.
 */
export async function fetchGoogleEvents(sourceId: number, rangeStart: Date, rangeEnd: Date): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error("Google Calendar is not connected");

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", rangeStart.toISOString());
  url.searchParams.set("timeMax", rangeEnd.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Google Calendar fetch failed: ${res.status}`);
  const json: { items?: GoogleEventItem[] } = await res.json();

  return (json.items ?? [])
    .filter((item) => item.start && item.end)
    .map((item) => {
      const allDay = Boolean(item.start!.date);
      const start = item.start!.dateTime ?? item.start!.date!;
      const end = item.end!.dateTime ?? item.end!.date!;
      return {
        id: `${sourceId}:${item.id}`,
        sourceId,
        title: item.summary || "(untitled)",
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay,
        location: item.location,
        description: item.description,
      };
    });
}
