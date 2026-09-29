import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories";
import { resolveCategories } from "@/lib/domain/tag/category_resolver";

type Fetch = RemoteTagCategories["fetch"];

function createRemoteTagCategories(fetch: Fetch): { fetch: ReturnType<typeof vi.fn<Fetch>> } {
  return { fetch: vi.fn<Fetch>(fetch) };
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
    const remoteTagCategories = createRemoteTagCategories(tagNames => Promise.resolve(new Map(tagNames.map(tagName => [tagName, "artist"]))));

    expect(await resolveCategories(remoteTagCategories, ["resolver_seen"])).toEqual(new Map([["resolver_seen", "artist"]]));
    expect(await resolveCategories(remoteTagCategories, ["resolver_seen", "resolver_new"])).toEqual(new Map([["resolver_seen", "artist"], ["resolver_new", "artist"]]));
    expect(remoteTagCategories.fetch).toHaveBeenLastCalledWith(["resolver_new"]);
  });

  test("files tags as general when the source fails, without remembering them", async() => {
    const failing = createRemoteTagCategories(() => Promise.reject(new Error("offline")));
    const working = createRemoteTagCategories(tagNames => Promise.resolve(new Map(tagNames.map(tagName => [tagName, "character"]))));

    expect(await resolveCategories(failing, ["resolver_failed"])).toEqual(new Map([["resolver_failed", "general"]]));
    expect(await resolveCategories(working, ["resolver_failed"])).toEqual(new Map([["resolver_failed", "character"]]));
  });
});
