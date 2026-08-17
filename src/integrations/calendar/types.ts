/** Unified shape every calendar source (local .ics, Google Calendar, ...) normalises into. */
export interface CalendarEvent {
  /** Stable across reloads: `${sourceId}:${uid}:${occurrenceStart}`. */
  id: string;
  sourceId: number;
  title: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601 */
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
}

export type CalendarSourceKind = "ics" | "google";

export interface CalendarSource {
  id: number;
  kind: CalendarSourceKind;
  name: string;
  file_path: string | null;
  account_email: string | null;
  color: string;
}
