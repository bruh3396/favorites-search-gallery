import { describe, expect, test } from "vitest";
import { MemoryTagSource } from "@/adapters/memory/ports/tag_source/tag_source";

describe("MemoryTagSource", () => {
  test("files every tag as general", async() => {
    expect(await new MemoryTagSource().fetchCategories(["apple", "alice"])).toEqual(new Map([["apple", "general"], ["alice", "general"]]));
  });
});
