import { describe, expect, test } from "vitest";
import { MemoryHost } from "@/adapters/memory/ports/host/host";

describe("MemoryHost", () => {
  test("has no header unless told it has one", () => {
    expect(new MemoryHost().hasHeader).toBe(false);
    expect(new MemoryHost(true).hasHeader).toBe(true);
  });

  test("remembers whether its header is visible", () => {
    const host = new MemoryHost(true);

    expect(host.headerVisible).toBe(true);
    host.setHeaderVisible(false);
    expect(host.headerVisible).toBe(false);
  });

  test("ignores header visibility when it has no header", () => {
    const host = new MemoryHost();

    host.setHeaderVisible(false);
    expect(host.headerVisible).toBe(true);
  });

  test("remembers its viewport being locked", () => {
    const host = new MemoryHost();

    expect(host.viewportLocked).toBe(false);
    host.lockViewport();
    expect(host.viewportLocked).toBe(true);
  });
});
