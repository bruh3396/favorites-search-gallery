import { describe, expect, test } from "vitest";
import { isFrozenCobaltTagCategory } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category";

describe("isFrozenCobaltTagCategory", () => {
  test.each(["general", "artist", "copyright", "character", "metadata"])("accepts %s", category => {
    expect(isFrozenCobaltTagCategory(category)).toBe(true);
  });

  test.each(["unknown", 0, null])("rejects %s", category => {
    expect(isFrozenCobaltTagCategory(category)).toBe(false);
  });
});
