import { afterEach, describe, expect, test, vi } from "vitest";
import { readBrowserColorScheme } from "@/adapters/browser/environment/browser_color_scheme_reader";

describe("readBrowserColorScheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([
    [true, "dark"],
    [false, "light"]
  ])("reads the color scheme the browser prefers (prefers dark: %s)", (matches, colorScheme) => {
    const matchMedia = vi.fn(() => ({ matches }));

    vi.stubGlobal("matchMedia", matchMedia);

    expect(readBrowserColorScheme()).toBe(colorScheme);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });
});
