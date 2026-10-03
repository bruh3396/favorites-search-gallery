import { afterEach, describe, expect, test, vi } from "vitest";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/navigator";

describe("BrowserNavigator", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("opens a URL in a new tab", () => {
    const open = vi.fn();

    vi.stubGlobal("window", { open });
    new BrowserNavigator().open("https://file");
    expect(open).toHaveBeenCalledWith("https://file", "_blank");
  });
});
