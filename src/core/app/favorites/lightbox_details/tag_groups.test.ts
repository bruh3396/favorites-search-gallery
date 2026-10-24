import { describe, expect, test } from "vitest";
import { groupTagsByCategory } from "@/core/app/favorites/lightbox_details/tag_groups";

describe("groupTagsByCategory", () => {
  test("orders groups artist, character, copyright, general, metadata", () => {
    const categories = new Map([
      ["highres", "metadata"],
      ["solo", "general"],
      ["overwatch", "copyright"],
      ["tracer", "character"],
      ["alice", "artist"]
    ] as const);

    expect(groupTagsByCategory(categories.keys(), categories).map(group => group.category))
      .toEqual(["artist", "character", "copyright", "general", "metadata"]);
  });

  test("sorts tags alphabetically within a group", () => {
    expect(groupTagsByCategory(["solo", "blonde", "smile"], new Map())).toEqual([{ category: "general", tags: ["blonde", "smile", "solo"] }]);
  });

  test("puts uncategorized and unknown tags under general", () => {
    expect(groupTagsByCategory(["mystery", "unsaved"], new Map([["mystery", "unknown"]])))
      .toEqual([{ category: "general", tags: ["mystery", "unsaved"] }]);
  });

  test("returns no groups for no tags", () => {
    expect(groupTagsByCategory([], new Map())).toEqual([]);
  });
});
