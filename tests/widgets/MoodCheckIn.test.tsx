import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoodCheckIn } from "../../src/widgets/built-in/MoodCheckIn/MoodCheckIn";
import { logMood } from "../../src/storage/moodLogs";

vi.mock("../../src/storage/moodLogs", () => ({
  listRecentMoodLogs: vi.fn().mockResolvedValue([]),
  logMood: vi.fn().mockResolvedValue(undefined),
}));

describe("MoodCheckIn widget", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("logs a mood for a past day selected from the history strip, not today", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T09:00:00Z"));

    render(<MoodCheckIn />);
    await act(async () => {
      await Promise.resolve();
    });

    // 3 days ago is within the 7-day window and should be clickable.
    fireEvent.click(screen.getByTitle("2026-08-16: click to log"));
    fireEvent.click(screen.getByLabelText("🙂"));
    fireEvent.click(screen.getByText("Log"));

    expect(logMood).toHaveBeenCalledWith("2026-08-16", "🙂", "");
  });

  it("does not render a day older than 7 days as clickable", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T09:00:00Z"));

    render(<MoodCheckIn />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByTitle(/2026-08-12/)).not.toBeInTheDocument();
  });
});
