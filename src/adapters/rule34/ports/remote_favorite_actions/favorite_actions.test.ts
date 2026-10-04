import { Rule34FavoriteActions, addFavoriteUrl, postVoteUrl, removeFavoriteUrl } from "@/adapters/rule34/ports/remote_favorite_actions/favorite_actions";
import { describe, expect, test, vi } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { advanceAndSettle } from "@/testing/async";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
type FetchMock = ReturnType<typeof vi.fn<Fetch>>;

interface Setup {
  actions: Rule34FavoriteActions;
  fetch: FetchMock;
  scheduler: MemoryScheduler;
}

function setup(respond: Fetch = (): Promise<Response> => Promise.resolve(new Response("3"))): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const scheduler = new MemoryScheduler();
  const actions = new Rule34FavoriteActions({ fetch, scheduler, randomSource: new MemoryRandomSource([1]) });
  return { actions, fetch, scheduler };
}

function requestedUrlsOf(fetch: FetchMock): string[] {
  return fetch.mock.calls.map(([url]) => url);
}

describe("Rule34FavoriteActions", () => {
  test("adding upvotes the post, favorites it, and reads the site's answer", async() => {
    const { actions, fetch } = setup();

    expect(await actions.add("7")).toBe("added");
    expect(requestedUrlsOf(fetch)).toEqual([postVoteUrl("7"), addFavoriteUrl("7")]);
  });

  test.each([
    ["0", "error"],
    ["1", "alreadyAdded"],
    ["2", "loggedOut"],
    ["3", "added"],
    ["?", "error"]
  ])("reads the site's add answer %s as %s", async(siteAnswer, answer) => {
    const { actions } = setup(() => Promise.resolve(new Response(siteAnswer)));

    expect(await actions.add("7")).toBe(answer);
  });

  test("adding ignores a failed upvote", async() => {
    const { actions } = setup(url => (
      url === postVoteUrl("7") ? Promise.reject(new TypeError("offline")) : Promise.resolve(new Response("3"))
    ));

    expect(await actions.add("7")).toBe("added");
  });

  test("removing unfavorites the post", async() => {
    const { actions, fetch } = setup();

    expect(await actions.remove("8")).toBe(true);
    expect(requestedUrlsOf(fetch)).toEqual([removeFavoriteUrl("8")]);
  });

  test("removing retries a network failure", async() => {
    const { actions, fetch, scheduler } = setup();

    fetch.mockRejectedValueOnce(new TypeError("offline"));
    const removed = actions.remove("8");

    await advanceAndSettle(scheduler, 1_000);
    expect(await removed).toBe(true);
    expect(requestedUrlsOf(fetch)).toEqual([removeFavoriteUrl("8"), removeFavoriteUrl("8")]);
  });

  test("removing a post cancels its add while the add waits its turn", async() => {
    const { actions, fetch } = setup();
    const first = actions.add("1");
    const second = actions.add("2");

    await actions.remove("2");
    expect(await first).toBe("added");
    expect(await second).toBeNull();
    expect(requestedUrlsOf(fetch)).not.toContain(addFavoriteUrl("2"));
  });

  test("adding a post cancels its remove while the remove waits its turn", async() => {
    const { actions, fetch } = setup();
    const first = actions.remove("1");
    const second = actions.remove("2");

    await actions.add("2");
    expect(await first).toBe(true);
    expect(await second).toBe(false);
    expect(requestedUrlsOf(fetch)).not.toContain(removeFavoriteUrl("2"));
  });
});
