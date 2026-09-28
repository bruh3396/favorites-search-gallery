import { afterEach, describe, expect, test, vi } from "vitest";
import { readFavoritesPageId, readPageMode, readQueryParam } from "@/adapters/rule34/client/location";

function visit(query: string): void {
  vi.stubGlobal("location", { href: `https://rule34.xxx/index.php?${query}` });
}

describe("location", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([
    ["page=favorites&s=view&id=1", "favorites"],
    ["page=post&s=list&tags=apple", "posts"],
    ["page=post&s=view&id=1", null]
  ])("reads the mode of %s", (query, mode) => {
    visit(query);

    expect(readPageMode()).toBe(mode);
  });

  test("reads the viewed favorites page id, empty when absent", () => {
    visit("page=favorites&id=123");
    expect(readFavoritesPageId()).toBe("123");

    visit("page=favorites");
    expect(readFavoritesPageId()).toBe("");
  });

  test("reads a query parameter, null when absent", () => {
    visit("page=favorites&pid=50");
    expect(readQueryParam("pid")).toBe("50");
    expect(readQueryParam("id")).toBeNull();
  });
});
