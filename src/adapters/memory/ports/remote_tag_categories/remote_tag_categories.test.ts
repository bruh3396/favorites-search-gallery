import { describe, expect, test } from "vitest";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";

describe("MemoryRemoteTagCategories", () => {
  test("files every tag as general", async() => {
    expect(await new MemoryRemoteTagCategories().fetch(["apple", "alice"])).toEqual(new Map([["apple", "general"], ["alice", "general"]]));
  });
});
