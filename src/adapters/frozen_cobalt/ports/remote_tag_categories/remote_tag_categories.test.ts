import { describe, expect, test } from "vitest";
import { FrozenCobaltRemoteTagCategories } from "@/adapters/frozen_cobalt/ports/remote_tag_categories/remote_tag_categories";
import { FrozenCobaltTagResult } from "@/adapters/frozen_cobalt/client/schema";

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
  test("decodes each tag's category", async() => {
    const remoteTagCategories = createRemoteTagCategories({
      apple: { status: "ok", category: 0 },
      alice: { status: "ok", category: 4 }
    });
    const expected = new Map([["apple", "general"], ["alice", "character"]]);

    expect(await remoteTagCategories.fetch(["apple", "alice"])).toEqual(expected);
  });

  test("leaves out tags that were rate limited or failed", async() => {
    const remoteTagCategories = createRemoteTagCategories({
      apple: { status: "ok", category: 1 },
      alice: { status: "rate_limited" }
    });

    expect(await remoteTagCategories.fetch(["apple", "alice", "bob"])).toEqual(new Map([["apple", "artist"]]));
  });
});
