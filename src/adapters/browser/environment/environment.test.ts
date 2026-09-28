import { afterEach, describe, expect, test, vi } from "vitest";
import { readBrowserEnvironment, readPrefersDarkMode } from "@/adapters/browser/environment/environment";

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

    expect(readBrowserEnvironment()).toEqual({ device, canvasBudget });
  });
});

describe("readPrefersDarkMode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([true, false])("reads the color scheme the browser prefers (dark: %s)", (matches) => {
    const matchMedia = vi.fn(() => ({ matches }));

    vi.stubGlobal("matchMedia", matchMedia);

    expect(readPrefersDarkMode()).toBe(matches);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });
});
