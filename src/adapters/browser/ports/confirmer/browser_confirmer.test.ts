import { afterEach, describe, expect, test, vi } from "vitest";
import { BrowserConfirmer } from "@/adapters/browser/ports/confirmer/browser_confirmer";

describe("BrowserConfirmer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([true, false])("answers %s as the browser's dialog does", answer => {
    const confirm = vi.fn(() => answer);

    vi.stubGlobal("window", { confirm });
    expect(new BrowserConfirmer().confirm("Sure?")).toBe(answer);
    expect(confirm).toHaveBeenCalledWith("Sure?");
  });
});
