import { FavoriteActions, addFavoriteUrl, postVoteUrl, removeFavoriteUrl } from "@/adapters/rule34/client/favorite_actions/favorite_actions";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchStub = vi.fn((_url: string, _init?: RequestInit): Promise<Response> => Promise.resolve(new Response("3")));

function requestedUrlsOf(): string[] {
  return fetchStub.mock.calls.map(([url]) => url);
}

describe("FavoriteActions", () => {
  beforeEach(() => {
    fetchStub.mockClear();
    vi.stubGlobal("fetch", fetchStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("adding upvotes the post, favorites it, and returns the site's answer", async() => {
    expect(await new FavoriteActions().add("7")).toBe("3");
    expect(requestedUrlsOf()).toEqual([postVoteUrl("7"), addFavoriteUrl("7")]);
  });

  test("removing unfavorites the post", async() => {
    expect(await new FavoriteActions().remove("8")).toBe(true);
    expect(requestedUrlsOf()).toEqual([removeFavoriteUrl("8")]);
  });

  test("removing a post cancels its add while the add waits its turn", async() => {
    const actions = new FavoriteActions();
    const first = actions.add("1");
    const second = actions.add("2");

    await actions.remove("2");
    expect(await first).toBe("3");
    expect(await second).toBeNull();
    expect(requestedUrlsOf()).not.toContain(addFavoriteUrl("2"));
  });

  test("adding a post cancels its remove while the remove waits its turn", async() => {
    const actions = new FavoriteActions();
    const first = actions.remove("1");
    const second = actions.remove("2");

    await actions.add("2");
    expect(await first).toBe(true);
    expect(await second).toBe(false);
    expect(requestedUrlsOf()).not.toContain(removeFavoriteUrl("2"));
  });
});
