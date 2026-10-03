import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteSearchResults } from "@/adapters/memory/ports/remote_search_results/remote_search_results";
import { createPost } from "@/testing/post";

function createSearchResults(): MemoryRemoteSearchResults {
  const memory = new MemoryClient(["1", "2", "3", "4", "5"].map(id => createPost({ id })));
  return new MemoryRemoteSearchResults({ pageSize: 2, initialPageIndex: 1 }, memory);
}

async function idsOnPage(pageIndex: number): Promise<string[]> {
  return (await createSearchResults().fetchPage(pageIndex)).map(post => post.id);
}

describe("MemoryRemoteSearchResults", () => {
  test("pages through its posts at the configured size, starting where configured", () => {
    const searchResults = createSearchResults();

    expect(searchResults.pageSize).toBe(2);
    expect(searchResults.initialPageIndex).toBe(1);
  });

  test("serves each page of posts in order, with a short last page and empty pages past it", async() => {
    expect(await idsOnPage(0)).toEqual(["1", "2"]);
    expect(await idsOnPage(2)).toEqual(["5"]);
    expect(await idsOnPage(3)).toEqual([]);
  });
});
