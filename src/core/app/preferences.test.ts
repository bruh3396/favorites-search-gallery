import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { createPostGridSettings } from "@/core/app/preferences";

describe("createPostGridPreferences", () => {
  test("starts with the defaults when nothing is stored", () => {
    const { layout, size, upscale } = createPostGridSettings(new MemoryLocalKeyedValues());

    expect([layout.value, size.value, upscale.value]).toEqual(["column", 6, false]);
  });

  test("restores a stored layout and falls back to the default for one it doesn't recognize", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("postGridLayout", "row");
    expect(createPostGridSettings(storage).layout.value).toBe("row");
    storage.set("postGridLayout", "masonry");
    expect(createPostGridSettings(storage).layout.value).toBe("column");
  });
});
