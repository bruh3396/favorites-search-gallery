import { describe, expect, test } from "vitest";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";

describe("MemoryRemotePages", () => {
  test("gives a post's URL as an in-page anchor", () => {
    expect(new MemoryRemotePages().postUrl("7")).toBe("#post-7");
  });

  test("gives a search's URL as an in-page anchor", () => {
    expect(new MemoryRemotePages().searchUrl("apple banana")).toBe("#search-apple%20banana");
  });
});
