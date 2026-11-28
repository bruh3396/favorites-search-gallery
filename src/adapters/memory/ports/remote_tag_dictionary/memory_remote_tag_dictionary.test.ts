import { describe, expect, test } from "vitest";
import { MemoryRemoteTagDictionary } from "@/adapters/memory/ports/remote_tag_dictionary/memory_remote_tag_dictionary";

describe("MemoryRemoteTagDictionary", () => {
  describe("fetch", () => {
    test("returns the dictionary it was given", async() => {
      const tagDictionary = new Map([["alice", "character" as const]]);

      expect(await new MemoryRemoteTagDictionary(tagDictionary).fetch()).toEqual(tagDictionary);
    });

    test("returns an empty dictionary by default", async() => {
      expect(await new MemoryRemoteTagDictionary().fetch()).toEqual(new Map());
    });
  });
});
