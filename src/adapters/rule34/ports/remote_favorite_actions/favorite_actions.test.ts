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

function readRequestedUrls(fetch: FetchMock): string[] {
  return fetch.mock.calls.map(([url]) => url);
}

describe("Rule34FavoriteActions", () => {
  test("upvotes the post, favorites it, and reads the site's answer when adding", async() => {
    const { actions, fetch } = setup();

    expect(await actions.add("7")).toBe("added");
    expect(readRequestedUrls(fetch)).toEqual([postVoteUrl("7"), addFavoriteUrl("7")]);
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

  test("ignores a failed upvote when adding", async() => {
    const { actions } = setup(url => (
      url === postVoteUrl("7") ? Promise.reject(new TypeError("offline")) : Promise.resolve(new Response("3"))
    ));

    expect(await actions.add("7")).toBe("added");
  });

  test("unfavorites the post when removing", async() => {
    const { actions, fetch } = setup();

    expect(await actions.remove("8")).toBe(true);
    expect(readRequestedUrls(fetch)).toEqual([removeFavoriteUrl("8")]);
  });

  test("retries a remove that hits a network failure", async() => {
    const { actions, fetch, scheduler } = setup();

    fetch.mockRejectedValueOnce(new TypeError("offline"));
    const removed = actions.remove("8");

    await advanceAndSettle(scheduler, 1_000);
    expect(await removed).toBe(true);
    expect(readRequestedUrls(fetch)).toEqual([removeFavoriteUrl("8"), removeFavoriteUrl("8")]);
  });

  test("cancels a post's waiting add when the post is removed", async() => {
    const { actions, fetch, scheduler } = setup();
    const first = actions.add("1");
    const second = actions.add("2");

    await actions.remove("2");
    await advanceAndSettle(scheduler, 1_000);
    expect(await first).toBe("added");
    expect(await second).toBeNull();
    expect(readRequestedUrls(fetch)).not.toContain(addFavoriteUrl("2"));
  });

  test("cancels a post's waiting remove when the post is added", async() => {
    const { actions, fetch, scheduler } = setup();
    const first = actions.remove("1");
    const second = actions.remove("2");

    await actions.add("2");
    await advanceAndSettle(scheduler, 1_000);
    expect(await first).toBe(true);
    expect(await second).toBe(false);
    expect(readRequestedUrls(fetch)).not.toContain(removeFavoriteUrl("2"));
  });

  test("ignores a second add of a post still waiting", async() => {
    const { actions, fetch, scheduler } = setup();
    const first = actions.add("1");
    const waiting = actions.add("2");
    const again = actions.add("2");

    await advanceAndSettle(scheduler, 1_000);
    expect(await first).toBe("added");
    expect(await waiting).toBe("added");
    expect(await again).toBeNull();
    expect(readRequestedUrls(fetch).filter(url => url === addFavoriteUrl("2"))).toHaveLength(1);
  });
});
