import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { Clock } from "../../src/widgets/built-in/Clock/Clock";

describe("Clock widget", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the current time and date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T09:41:00"));

    render(<Clock />);

    expect(screen.getByText("09:41:00")).toBeInTheDocument();
    const dateText = screen.getByText(/Sunday/).textContent ?? "";
    expect(dateText).toContain("Sunday");
    expect(dateText).toContain("16");
    expect(dateText).toContain("August");
  });
});
