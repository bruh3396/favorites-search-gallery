import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { resolveCategories } from "@/lib/domain/tag/category_resolver";

type FetchCategories = (tagNames: string[]) => Promise<TagCategoryMap>;

function createTagSource(fetchCategories: FetchCategories): { fetchCategories: ReturnType<typeof vi.fn<FetchCategories>> } {
  return { fetchCategories: vi.fn<FetchCategories>(fetchCategories) };
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
    const tagSource = createTagSource(tagNames => Promise.resolve(new Map(tagNames.map(tagName => [tagName, "artist"]))));

    expect(await resolveCategories(tagSource, ["resolver_seen"])).toEqual(new Map([["resolver_seen", "artist"]]));
    expect(await resolveCategories(tagSource, ["resolver_seen", "resolver_new"])).toEqual(new Map([["resolver_seen", "artist"], ["resolver_new", "artist"]]));
    expect(tagSource.fetchCategories).toHaveBeenLastCalledWith(["resolver_new"]);
  });

  test("files tags as general when the source fails, without remembering them", async() => {
    const failing = createTagSource(() => Promise.reject(new Error("offline")));
    const working = createTagSource(tagNames => Promise.resolve(new Map(tagNames.map(tagName => [tagName, "character"]))));

    expect(await resolveCategories(failing, ["resolver_failed"])).toEqual(new Map([["resolver_failed", "general"]]));
    expect(await resolveCategories(working, ["resolver_failed"])).toEqual(new Map([["resolver_failed", "character"]]));
  });
});
