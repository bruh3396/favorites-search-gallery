import { describe, expect, test } from "vitest";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/memory_clipboard";

describe("MemoryClipboard", () => {
  test("keeps the last text written", async() => {
    const clipboard = new MemoryClipboard();

    await clipboard.write("1");
    await clipboard.write("2");
    expect(clipboard.text).toBe("2");
  });
});
