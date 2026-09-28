import { describe, expect, test } from "vitest";
import { MemoryHost } from "@/adapters/memory/ports/host/host";

describe("MemoryHost", () => {
  test("has no header unless told it has one", () => {
    expect(new MemoryHost().setHeaderVisible).toBeNull();
  });

  test("remembers whether its header is visible", () => {
    const host = new MemoryHost(true);

    expect(host.headerVisible).toBe(true);
    host.setHeaderVisible?.(false);
    expect(host.headerVisible).toBe(false);
  });

  test("remembers its viewport being locked", () => {
    const host = new MemoryHost();

    expect(host.viewportLocked).toBe(false);
    host.lockViewport();
    expect(host.viewportLocked).toBe(true);
  });
});
