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

interface GoogleEventsResponse {
  items?: GoogleEventItem[];
  nextPageToken?: string;
}

/**
 * Google's all-day `date` fields are plain "YYYY-MM-DD" with no time or
 * offset. `new Date("YYYY-MM-DD")` parses that as UTC midnight, which lands
 * on the *previous* local day in any timezone behind UTC — silently wrong
 * for day-based display (`eventsOnDay`/`startOfDay` in dateUtils.ts). Parse
 * it as local midnight instead, same convention `icsDate.ts` uses for .ics
 * all-day values.
 */
function parseGoogleDateOnly(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Fetches events from the user's primary Google Calendar in [rangeStart,
 * rangeEnd], following `nextPageToken` until exhausted (a busy calendar can
 * exceed a single 250-result page). Throws on network/auth failure —
 * callers fall back to the last cached copy (see storage/calendar.ts)
 * rather than surfacing a blank widget.
 */
export async function fetchGoogleEvents(sourceId: number, rangeStart: Date, rangeEnd: Date): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error("Google Calendar is not connected");

  const items: GoogleEventItem[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("timeMin", rangeStart.toISOString());
    url.searchParams.set("timeMax", rangeEnd.toISOString());
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "250");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error(`Google Calendar fetch failed: ${res.status}`);
    const json: GoogleEventsResponse = await res.json();
    items.push(...(json.items ?? []));
    pageToken = json.nextPageToken;
  } while (pageToken);

  return items
    .filter((item) => item.start && item.end)
    .map((item) => {
      const allDay = Boolean(item.start!.date);
      const start = allDay ? parseGoogleDateOnly(item.start!.date!) : new Date(item.start!.dateTime!);
      const end = allDay ? parseGoogleDateOnly(item.end!.date!) : new Date(item.end!.dateTime!);
      return {
        id: `${sourceId}:${item.id}`,
        sourceId,
        title: item.summary || "(untitled)",
        start: start.toISOString(),
        end: end.toISOString(),
        allDay,
        location: item.location,
        description: item.description,
      };
    });
}
