import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiTagSource } from "@/adapters/api/ports/tag_source/tag_source";
import { TagCategoryMap } from "@/types/search";
import { TagResponse } from "@/adapters/api/client/tag/tag";

function setup(responses: Record<string, TagResponse>): { source: ApiTagSource; siteTags: { categorize: ReturnType<typeof vi.fn<(postId: string, tagNames: string[]) => Promise<TagCategoryMap>>> } } {
  const api = { fetchTag: (tagName: string): Promise<TagResponse> => Promise.resolve(responses[tagName]) };
  const siteTags = { categorize: vi.fn<(postId: string, tagNames: string[]) => Promise<TagCategoryMap>>((_postId: string, tagNames: string[]): Promise<TagCategoryMap> => Promise.resolve(new Map(tagNames.map(tagName => [tagName, "artist"])))) };
  return { source: new ApiTagSource(api, siteTags), siteTags };
}

async function categorizedFor(source: ApiTagSource, postId: string, tagNames: string[]): Promise<TagCategoryMap> {
  const categorized = source.categorize(postId, tagNames);

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
    const { source } = setup({ apple: { status: "ok", category: 0 }, alice: { status: "ok", category: 4 } });

    expect(await categorizedFor(source, "1", ["apple", "alice"])).toEqual(new Map([["apple", "general"], ["alice", "character"]]));
  });

  test("asks the site when rate limited", async() => {
    const { source, siteTags } = setup({ apple: { status: "rate_limited" } });

    expect(await categorizedFor(source, "1", ["apple"])).toEqual(new Map([["apple", "artist"]]));
    expect(siteTags.categorize).toHaveBeenCalledWith("1", ["apple"]);
  });
});
