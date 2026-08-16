import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeSwitcher } from "../../src/components/ThemeSwitcher";

vi.mock("../../src/storage/settings", () => ({
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));

describe("ThemeSwitcher", () => {
  it("hot-swaps the document theme without a page reload", () => {
    render(<ThemeSwitcher />);

    expect(document.documentElement.dataset.theme).toBe("matte");

    fireEvent.click(screen.getByLabelText("Change theme"));
    expect(screen.getByText("Retro")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitemradio", { name: /Retro/ }));

    expect(document.documentElement.dataset.theme).toBe("retro");
    expect(screen.queryByText("Retro")).not.toBeInTheDocument();
  });

  it("lists all six built-in themes", () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByLabelText("Change theme"));

    for (const label of ["Liquid Glass", "Matte", "Glossy", "Retro", "Cyberpunk", "Steampunk"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
