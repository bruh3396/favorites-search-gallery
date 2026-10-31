import { describe, expect, test } from "vitest";
import { FrozenCobaltRemoteTagCategories } from "@/adapters/frozen_cobalt/ports/remote_tag_categories/frozen_cobalt_remote_tag_categories";
import { FrozenCobaltTagResult } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_result";

function createRemoteTagCategories(results: Record<string, FrozenCobaltTagResult>): FrozenCobaltRemoteTagCategories {
  return new FrozenCobaltRemoteTagCategories({
    fetchTagCategory: (tagName: string): Promise<FrozenCobaltTagResult> => {
      if (tagName in results) {
        return Promise.resolve(results[tagName]);
      }
      return Promise.reject(new Error("down"));
    }
  });
}

describe("FrozenCobaltRemoteTagCategories", () => {
  test("returns each tag's category", async() => {
    const remoteTagCategories = createRemoteTagCategories({
      apple: { status: "ok", category: "general" },
      alice: { status: "ok", category: "character" }
    });
    const expected = new Map([["apple", "general"], ["alice", "character"]]);

    expect(await remoteTagCategories.fetch(["apple", "alice"])).toEqual(expected);
  });

  test("treats a tag Frozen Cobalt can't find as general", async() => {
    const remoteTagCategories = createRemoteTagCategories({ old_tag: { status: "not_found" } });

    expect(await remoteTagCategories.fetch(["old_tag"])).toEqual(new Map([["old_tag", "general"]]));
  });

  test("leaves out tags to retry or that failed", async() => {
    const remoteTagCategories = createRemoteTagCategories({
      apple: { status: "ok", category: "artist" },
      alice: { status: "retry" }
    });

    expect(await remoteTagCategories.fetch(["apple", "alice", "bob"])).toEqual(new Map([["apple", "artist"]]));
  });
});
