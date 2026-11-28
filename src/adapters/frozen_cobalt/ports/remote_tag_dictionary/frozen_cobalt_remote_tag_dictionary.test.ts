import { Mock, describe, expect, test, vi } from "vitest";
import { FrozenCobaltRemoteTagDictionary } from "@/adapters/frozen_cobalt/ports/remote_tag_dictionary/frozen_cobalt_remote_tag_dictionary";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { advanceAndSettle } from "@/testing/microtask_utilities";

type Fetch = Mock<(url: string, init: RequestInit) => Promise<Response>>;

const URL = "https://cdn.frozen-cobalt.test/tag_dictionary/tag_dictionary_v1.txt";
const REQUEST_TIMEOUT = 1_000;

function answerWith(body: string, status = 200): Fetch {
  return vi.fn(() => Promise.resolve(new Response(body, { status })));
}

async function fetchTagDictionary(fetch: Fetch): Promise<unknown> {
  const scheduler = new MemoryScheduler();
  const fetched = new FrozenCobaltRemoteTagDictionary({ url: URL, requestTimeout: REQUEST_TIMEOUT }, { scheduler, fetch }).fetch();

  fetched.catch(() => { });
  await advanceAndSettle(scheduler, REQUEST_TIMEOUT);
  return fetched;
}

describe("FrozenCobaltRemoteTagDictionary", () => {
  test("reads each line as a category digit followed by a tag name", async() => {
    expect(await fetchTagDictionary(answerWith("0female\n1artist_name\n2mortal_kombat\n3mileena\n43d\n"))).toEqual(new Map([
      ["female", "general"],
      ["artist_name", "artist"],
      ["mortal_kombat", "copyright"],
      ["mileena", "character"],
      ["3d", "metadata"]
    ]));
  });

  test("fetches the url it was given", async() => {
    const fetch = answerWith("0female");

    await fetchTagDictionary(fetch);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([URL]);
  });

  test("rejects the whole dictionary when one line has an unknown category digit", async() => {
    await expect(fetchTagDictionary(answerWith("0female\n9alice\n"))).rejects.toMatchObject({ reason: "malformed", subject: "9alice" });
  });

  test("rejects a line with a category digit but no name", async() => {
    await expect(fetchTagDictionary(answerWith("0female\n3\n"))).rejects.toMatchObject({ reason: "malformed" });
  });

  test("rejects an empty dictionary", async() => {
    await expect(fetchTagDictionary(answerWith(""))).rejects.toMatchObject({ reason: "malformed" });
  });

  test("rejects with the status when the server answers with an error", async() => {
    await expect(fetchTagDictionary(answerWith("", 404))).rejects.toMatchObject({ reason: "http", status: 404 });
  });

  test("rejects as a network failure when the request can't be sent", async() => {
    const blocked = new TypeError("Failed to fetch");

    await expect(fetchTagDictionary(vi.fn(() => Promise.reject(blocked)))).rejects.toMatchObject({ reason: "network", cause: blocked });
  });

  test("aborts a request that outlasts the timeout", async() => {
    const fetch: Fetch = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    }));

    await expect(fetchTagDictionary(fetch)).rejects.toMatchObject({ reason: "timeout" });
  });
});
