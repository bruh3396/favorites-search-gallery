import { describe, expect, test, vi } from "vitest";
import { BrowserClipboard } from "@/adapters/browser/ports/clipboard/clipboard";

describe("BrowserClipboard", () => {
  test("writes the text to the system clipboard", async() => {
    const writeText = vi.fn(() => Promise.resolve());

    await new BrowserClipboard({ writeText }).write("123");
    expect(writeText).toHaveBeenCalledWith("123");
  });
});
