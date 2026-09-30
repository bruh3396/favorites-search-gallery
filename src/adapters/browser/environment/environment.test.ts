import { afterEach, describe, expect, test, vi } from "vitest";
import { readBrowserEnvironment, readPreferredColorScheme } from "@/adapters/browser/environment/environment";

const FIREFOX = "Mozilla/5.0 (Windows NT 10.0; rv:130.0) Gecko/20100101 Firefox/130.0";
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const ANDROID = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

describe("readBrowserEnvironment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([
    [CHROME, "desktop", "full"],
    [FIREFOX, "desktop", "reduced"],
    [ANDROID, "mobile", "full"]
  ])("reads the device and canvas budget from the user agent (%s)", (userAgent, device, canvasBudget) => {
    vi.stubGlobal("navigator", { userAgent });
    vi.stubGlobal("matchMedia", () => ({ matches: true }));

    expect(readBrowserEnvironment()).toMatchObject({ device, canvasBudget });
  });

  test.each([
    [true, "hover"],
    [false, "touch"]
  ])("reads the primary input as a pointer (can hover finely: %s)", (matches, pointer) => {
    const matchMedia = vi.fn(() => ({ matches }));

    vi.stubGlobal("navigator", { userAgent: CHROME });
    vi.stubGlobal("matchMedia", matchMedia);

    expect(readBrowserEnvironment().pointer).toBe(pointer);
    expect(matchMedia).toHaveBeenCalledWith("(hover: hover) and (pointer: fine)");
  });
});

describe("readPreferredColorScheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([
    [true, "dark"],
    [false, "light"]
  ])("reads the color scheme the browser prefers (prefers dark: %s)", (matches, colorScheme) => {
    const matchMedia = vi.fn(() => ({ matches }));

    vi.stubGlobal("matchMedia", matchMedia);

    expect(readPreferredColorScheme()).toBe(colorScheme);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });
});
