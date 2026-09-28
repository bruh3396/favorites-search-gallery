import { describe, expect, test, vi } from "vitest";
import { Rule34TagSource } from "@/adapters/rule34/tag_source/tag_source";
import { TagCategoryMap } from "@/types/search";

describe("Rule34TagSource", () => {
  test("reads the requested tags' categories from the post's page, general when absent", async() => {
    const site = { fetchPostPageTagCategories: vi.fn((): Promise<TagCategoryMap> => Promise.resolve(new Map([["alice", "character"], ["bob", "artist"]]))) };
    const categories = await new Rule34TagSource(site).categorize("42", ["alice", "apple"]);

    expect(site.fetchPostPageTagCategories).toHaveBeenCalledWith("42");
    expect(categories).toEqual(new Map([["alice", "character"], ["apple", "general"]]));
  });
});
