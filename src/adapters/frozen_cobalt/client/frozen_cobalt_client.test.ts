import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/frozen_cobalt_client";
import { FrozenCobaltIdentity } from "@/adapters/frozen_cobalt/client/frozen_cobalt_identity";
import { Mock, describe, expect, test, vi } from "vitest";
import { advanceAndSettle, flushMicrotasks } from "@/testing/microtask_utilities";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";

type Fetch = Mock<(url: string, init: RequestInit) => Promise<Response>>;

interface Setup {
  frozenCobaltClient: FrozenCobaltClient;
  scheduler: MemoryScheduler;
  fetch: Fetch;
}

const ORIGIN = "https://frozen-cobalt.test";

function createFetch(answer: (body: Record<string, string[]>) => unknown = () => ({})): Fetch {
  return vi.fn((_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as Record<string, string[]>;
    return Promise.resolve(new Response(JSON.stringify(answer(body))));
  });
}

function answerEach(keys: string[], result: (key: string) => unknown): Record<string, unknown> {
  return Object.fromEntries(keys.map(key => [key, result(key)]));
}

function setup(fetch: Fetch = createFetch(), frozenCobaltIdentity?: FrozenCobaltIdentity): Setup {
  const scheduler = new MemoryScheduler();
  return { frozenCobaltClient: new FrozenCobaltClient({ origin: ORIGIN, identity: frozenCobaltIdentity }, { scheduler, fetch }), scheduler, fetch };
}

function readRequests(fetch: Fetch): { url: string; body: unknown }[] {
  return fetch.mock.calls.map(([url, init]) => ({ url, body: JSON.parse(String(init.body)) as unknown }));
}

async function fetchPostResult({ frozenCobaltClient, scheduler }: Pick<Setup, "frozenCobaltClient" | "scheduler">, postId: string): Promise<unknown> {
  const fetched = frozenCobaltClient.fetchPost(postId);

  fetched.catch(() => { });
  await advanceAndSettle(scheduler, 20_000);
  return fetched;
}

describe("FrozenCobaltClient", () => {
  test("batches posts asked for together into one request to its origin", async() => {
    const fetch = createFetch(({ ids }) => answerEach(ids, id => ({ status: id === "1" ? "deleted" : "retry" })));
    const { frozenCobaltClient, scheduler } = setup(fetch);
    const fetched = Promise.all([frozenCobaltClient.fetchPost("1"), frozenCobaltClient.fetchPost("2")]);

    await advanceAndSettle(scheduler, 10_000);
    expect(await fetched).toEqual([{ status: "deleted" }, { status: "retry" }]);
    expect(readRequests(fetch)).toEqual([{ url: `${ORIGIN}/posts`, body: { ids: ["1", "2"] } }]);
  });

  test("batches tag categories asked for together into one request", async() => {
    const fetch = createFetch(({ tagNames }) => answerEach(tagNames, () => ({ status: "ok", category: "general" })));
    const { frozenCobaltClient, scheduler } = setup(fetch);
    const fetched = Promise.all([frozenCobaltClient.fetchTagCategory("apple"), frozenCobaltClient.fetchTagCategory("alice")]);

    await advanceAndSettle(scheduler, 10_000);
    expect(await fetched).toHaveLength(2);
    expect(readRequests(fetch)).toEqual([{ url: `${ORIGIN}/tags`, body: { tagNames: ["apple", "alice"] } }]);
  });

  test("rejects a post whose result is malformed", async() => {
    await expect(fetchPostResult(setup(createFetch(() => ({ 1: { status: "ok", post: { id: "1" } } }))), "1")).rejects.toMatchObject({ reason: "malformed", subject: "1" });
  });

  test("rejects a post the response leaves out as malformed", async() => {
    await expect(fetchPostResult(setup(createFetch(() => ({}))), "1")).rejects.toMatchObject({ reason: "malformed", subject: "1" });
  });

  test("rejects a response that isn't a JSON object as malformed", async() => {
    await expect(fetchPostResult(setup(vi.fn(() => Promise.resolve(new Response("<html>")))), "1")).rejects.toMatchObject({
      reason: "malformed",
      cause: expect.any(SyntaxError)
    });
  });

  test("rejects a response that is JSON but not an object as malformed", async() => {
    await expect(fetchPostResult(setup(vi.fn(() => Promise.resolve(new Response("[]")))), "1")).rejects.toMatchObject({ reason: "malformed" });
  });

  test("rejects with the status when the server answers with an error", async() => {
    await expect(fetchPostResult(setup(vi.fn(() => Promise.resolve(new Response("", { status: 503 })))), "1")).rejects.toMatchObject({ reason: "http", status: 503 });
  });

  test("rejects as a network failure when the request can't be sent", async() => {
    const offline = new TypeError("Failed to fetch");
    await expect(fetchPostResult(setup(vi.fn(() => Promise.reject(offline))), "1")).rejects.toMatchObject({ reason: "network", cause: offline });
  });

  test("aborts a request that outlasts the timeout", async() => {
    const fetch: Fetch = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    }));

    await expect(fetchPostResult(setup(fetch), "1")).rejects.toMatchObject({ reason: "timeout" });
  });

  test("identifies every request by the identity it was built with", async() => {
    const { frozenCobaltClient, fetch } = setup(createFetch(), { userId: "9", version: "1.0", platform: "mobile" });
    const headers = {
      "Content-Type": "application/json",
      "X-User-Id": "9",
      "X-Version": "1.0",
      "X-Platform": "mobile"
    };

    frozenCobaltClient.ping();
    await flushMicrotasks();
    expect(fetch.mock.calls.map(([url, init]) => [url, init.headers])).toEqual([[`${ORIGIN}/ping`, headers]]);
  });

  test("is anonymous unless given an identity", async() => {
    const { frozenCobaltClient, fetch } = setup();
    const headers = { "Content-Type": "application/json", "X-User-Id": "", "X-Version": "", "X-Platform": "" };

    frozenCobaltClient.ping();
    await flushMicrotasks();
    expect(fetch.mock.calls.map(([, init]) => init.headers)).toEqual([headers]);
  });

  test("swallows a failed ping", async() => {
    const { frozenCobaltClient } = setup(vi.fn(() => Promise.reject(new Error("offline"))));

    frozenCobaltClient.ping();
    await flushMicrotasks();
  });
});
