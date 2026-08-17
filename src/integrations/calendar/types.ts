/** Unified shape every calendar source (local .ics today, Google Calendar later) normalises into. */
export interface CalendarEvent {
  id: number;
  uid: string | null;
  title: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601 */
  end: string;
  allDay: boolean;
  source: "ics" | "google";
}
