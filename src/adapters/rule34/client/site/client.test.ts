import { describe, expect, test, vi } from "vitest";
import { MemoryRandom } from "@/adapters/memory/ports/random/random";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34Error } from "@/adapters/rule34/client/error";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { postPageUrl } from "@/adapters/rule34/client/site/post_page/url";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

interface Setup {
  client: Rule34SiteClient;
  fetch: ReturnType<typeof vi.fn<Fetch>>;
}

const POST_PAGE = `
  <img id="image" src="https://us.rule34.xxx//images/1234/a1b2c3.png">
  <div id="stats"><ul>
    <li>Id: 42</li>
    <li>Size: 1920x1080</li>
    <li>Rating: Explicit</li>
    <li>Score: 7</li>
  </ul></div>
  <ul>
    <li class="tag-type-character tag"><a>?</a><a>alice</a></li>
    <li class="tag-type-artist tag"><a>?</a><a>bob</a></li>
  </ul>
`;

function setup(respond: Fetch = (): Promise<Response> => Promise.resolve(new Response(POST_PAGE))): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const dependencies = { fetch, scheduler: new MemoryScheduler(), random: new MemoryRandom() };
  return { client: new Rule34SiteClient(dependencies, { run: request => request() }), fetch };
}

describe("Rule34SiteClient", () => {
  test("reads a post and its tag categories from the post's page", async() => {
    const { client, fetch } = setup();
    const { post, tagCategories } = await client.fetchPostPage("42");

    expect(fetch).toHaveBeenCalledWith(postPageUrl("42"), undefined);
    expect(post).toMatchObject({ id: "42", width: 1_920, height: 1_080, deleted: true });
    expect(tagCategories).toEqual(new Map([["alice", "character"], ["bob", "artist"]]));
  });

  test("holds post page fetches while favorites are fetched, whether they succeed or fail", async() => {
    const { client, fetch } = setup();
    let finishFirst = (): void => { };
    let failSecond: (error: Error) => void = () => { };
    const first = client.prioritizeFavorites(() => new Promise<void>(resolve => {
      finishFirst = resolve;
    }));
    const second = client.prioritizeFavorites(() => new Promise<void>((_resolve, reject) => {
      failSecond = reject;
    }));
    const fetched = client.fetchPostPage("42");

    second.catch(() => { });
    finishFirst();
    await first;
    expect(fetch).not.toHaveBeenCalled();

    failSecond(new Error("boom"));
    await fetched;
    expect(fetch).toHaveBeenCalledOnce();
  });

  test("names a page the host refuses", async() => {
    const { client } = setup(() => Promise.resolve(new Response(null, { status: 503 })));

    await expect(client.fetchPostPage("42")).rejects.toMatchObject({ reason: "http", status: 503 });
  });

  test("names a page it can't read", async() => {
    const { client } = setup(() => Promise.resolve(new Response("<html></html>")));

    await expect(client.fetchPostPage("42")).rejects.toThrow(Rule34Error);
  });

  test("hands back what the favorites fetch returns", async() => {
    const { client } = setup();

    expect(await client.prioritizeFavorites(() => Promise.resolve(7))).toBe(7);
  });
});
