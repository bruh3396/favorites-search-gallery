import { describe, expect, test } from "vitest";
import { MemoryLinks } from "@/adapters/memory/ports/links/links";

describe("MemoryLinks", () => {
  test("links a post to an in-page anchor", () => {
    expect(new MemoryLinks().postUrl("7")).toBe("#post-7");
  });

  test("records each place it was asked to open, in order", () => {
    const links = new MemoryLinks();

    links.openInNewTab("data:image/png;base64,AA");
    links.openSearchInNewTab("apple banana");
    expect(links.opened).toEqual(["data:image/png;base64,AA", "#search-apple%20banana"]);
  });
});
