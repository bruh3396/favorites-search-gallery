import { describe, expect, test } from "vitest";
import { MemoryNavigation } from "@/adapters/memory/ports/navigation/navigation";

describe("MemoryNavigation", () => {
  test("gives a post's URL as an in-page anchor", () => {
    expect(new MemoryNavigation().postUrl("7")).toBe("#post-7");
  });

  test("records each place it was asked to open, in order", () => {
    const navigation = new MemoryNavigation();

    navigation.openInNewTab("data:image/png;base64,AA");
    navigation.openSearchInNewTab("apple banana");
    expect(navigation.opened).toEqual(["data:image/png;base64,AA", "#search-apple%20banana"]);
  });
});
