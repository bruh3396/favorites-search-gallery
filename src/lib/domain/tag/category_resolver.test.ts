import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TagCategoryMap } from "@/types/search";
import { resolveCategories } from "@/lib/domain/tag/category_resolver";

type Categorize = (postId: string, tagNames: string[]) => Promise<TagCategoryMap>;

function createTagSource(categorize: Categorize): { categorize: ReturnType<typeof vi.fn<Categorize>> } {
  return { categorize: vi.fn<Categorize>(categorize) };
}

describe("resolveCategories", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => { });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("asks the source only for tags it hasn't seen", async() => {
    const tagSource = createTagSource((_postId, tagNames) => Promise.resolve(new Map(tagNames.map(tagName => [tagName, "artist"]))));

    expect(await resolveCategories(tagSource, "1", ["resolver_seen"])).toEqual(new Map([["resolver_seen", "artist"]]));
    expect(await resolveCategories(tagSource, "2", ["resolver_seen", "resolver_new"])).toEqual(new Map([["resolver_seen", "artist"], ["resolver_new", "artist"]]));
    expect(tagSource.categorize).toHaveBeenLastCalledWith("2", ["resolver_new"]);
  });

  test("files tags as general when the source fails, without remembering them", async() => {
    const failing = createTagSource(() => Promise.reject(new Error("offline")));
    const working = createTagSource((_postId, tagNames) => Promise.resolve(new Map(tagNames.map(tagName => [tagName, "character"]))));

    expect(await resolveCategories(failing, "1", ["resolver_failed"])).toEqual(new Map([["resolver_failed", "general"]]));
    expect(await resolveCategories(working, "1", ["resolver_failed"])).toEqual(new Map([["resolver_failed", "character"]]));
  });
});
