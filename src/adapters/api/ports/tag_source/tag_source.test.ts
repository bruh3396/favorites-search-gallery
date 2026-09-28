import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiTagSource } from "@/adapters/api/ports/tag_source/tag_source";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { TagResponse } from "@/adapters/api/client/tag/tag";

function createSource(responses: Record<string, TagResponse>): ApiTagSource {
  return new ApiTagSource({ fetchTag: (tagName: string): Promise<TagResponse> => Promise.resolve(responses[tagName]) });
}

async function categorizedFor(source: ApiTagSource, tagNames: string[]): Promise<TagCategoryMap> {
  const categorized = source.fetchCategories(tagNames);

  await vi.advanceTimersByTimeAsync(10_000);
  return categorized;
}

describe("ApiTagSource", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("decodes each tag's category", async() => {
    const source = createSource({ apple: { status: "ok", category: 0 }, alice: { status: "ok", category: 4 } });

    expect(await categorizedFor(source, ["apple", "alice"])).toEqual(new Map([["apple", "general"], ["alice", "character"]]));
  });

  test("rejects when rate limited", async() => {
    const source = createSource({ apple: { status: "rate_limited" } });

    await expect(source.fetchCategories(["apple"])).rejects.toThrow();
  });
});
