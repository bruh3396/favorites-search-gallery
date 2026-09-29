import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiRemoteTagCategories } from "@/adapters/api/ports/remote_tag_categories/remote_tag_categories";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { TagResponse } from "@/adapters/api/client/tag/tag";

function createRemoteTagCategories(responses: Record<string, TagResponse>): ApiRemoteTagCategories {
  return new ApiRemoteTagCategories({ fetchTag: (tagName: string): Promise<TagResponse> => Promise.resolve(responses[tagName]) });
}

async function categorizedFor(source: ApiRemoteTagCategories, tagNames: string[]): Promise<TagCategoryMap> {
  const categorized = source.fetch(tagNames);

  await vi.advanceTimersByTimeAsync(10_000);
  return categorized;
}

describe("ApiRemoteTagCategories", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("decodes each tag's category", async() => {
    const source = createRemoteTagCategories({ apple: { status: "ok", category: 0 }, alice: { status: "ok", category: 4 } });

    expect(await categorizedFor(source, ["apple", "alice"])).toEqual(new Map([["apple", "general"], ["alice", "character"]]));
  });

  test("rejects when rate limited", async() => {
    const source = createRemoteTagCategories({ apple: { status: "rate_limited" } });

    await expect(source.fetch(["apple"])).rejects.toThrow();
  });
});
