import { describe, expect, test } from "vitest";
import { MediaItem } from "@/types/media";
import { MemoryNavigation } from "@/adapters/memory/ports/navigation/navigation";

describe("MemoryNavigation", () => {
  test("links a post to an in-page anchor", () => {
    expect(new MemoryNavigation().postUrl("7")).toBe("#post-7");
  });

  test("records each place it was asked to open, in order", () => {
    const navigation = new MemoryNavigation();

    navigation.openPost("7");
    navigation.openMedia({ id: "8" } as MediaItem);
    navigation.openSearch("apple banana");
    expect(navigation.opened).toEqual(["#post-7", "#media-8", "#search-apple%20banana"]);
  });
});
