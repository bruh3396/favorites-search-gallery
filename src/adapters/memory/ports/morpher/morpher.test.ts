import { describe, expect, test } from "vitest";
import { MemoryMorpher } from "@/adapters/memory/ports/morpher/morpher";

describe("MemoryMorpher", () => {
  test("updates the page at once and records each morph", () => {
    const morpher = new MemoryMorpher();
    const source = document.createElement("canvas");
    const target = document.createElement("div");
    const updates: string[] = [];

    morpher.morph(source, () => {
      updates.push("updated");
      return target;
    });
    expect(updates).toEqual(["updated"]);
    expect(morpher.morphs).toEqual([{ source, target }]);
  });
});
