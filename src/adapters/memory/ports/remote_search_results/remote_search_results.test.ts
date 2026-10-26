import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteSearchResults } from "@/adapters/memory/ports/remote_search_results/remote_search_results";
import { createPost } from "@/testing/post";

function createSearchResults(): MemoryRemoteSearchResults {
  const memory = new MemoryClient(["1", "2", "3", "4", "5"].map(id => createPost({ id })));
  return new MemoryRemoteSearchResults({ pageSize: 2, initialPageIndex: 1 }, memory);
}

async function pageAt(index: number): Promise<{ index: number; ids: string[] }> {
  const page = await createSearchResults().fetchPage(index);
  return { index: page.index, ids: page.posts.map(post => post.id) };
}

describe("MemoryRemoteSearchResults", () => {
  test("reads the configured initial page", async() => {
    const searchResults = createSearchResults();
    const page = searchResults.readInitialPage();

    expect(page.index).toBe(1);
    expect(page.posts.map(post => post.id)).toEqual(["3", "4"]);
    expect(searchResults.readInitialPage()).toBe(page);
    await expect(searchResults.fetchPage(1)).resolves.toBe(page);
  });

  test("serves each page of posts in order, with a short last page and empty pages past it", async() => {
    expect(await pageAt(0)).toEqual({ index: 0, ids: ["1", "2"] });
    expect(await pageAt(2)).toEqual({ index: 2, ids: ["5"] });
    expect(await pageAt(3)).toEqual({ index: 3, ids: [] });
  });
});
