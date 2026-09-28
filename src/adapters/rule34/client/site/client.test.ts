import { afterEach, describe, expect, test, vi } from "vitest";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { postPageUrl } from "@/adapters/rule34/client/site/post_page/post_page";

const POST_PAGE = `
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

function setup(): { client: Rule34SiteClient; fetch: ReturnType<typeof vi.fn<(url: string) => Promise<Response>>> } {
  const fetch = vi.fn((_url: string) => Promise.resolve(new Response(POST_PAGE)));

  vi.stubGlobal("fetch", fetch);
  return { client: new Rule34SiteClient({ run: request => request() }), fetch };
}

describe("Rule34SiteClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reads a post and its tag categories from the post's page", async() => {
    const { client, fetch } = setup();
    const { post, tagCategories } = await client.fetchPostPage("42");

    expect(fetch).toHaveBeenCalledWith(postPageUrl("42"), undefined);
    expect(post).toMatchObject({ id: "42", width: 1920, height: 1080, deleted: true });
    expect(tagCategories).toEqual(new Map([["alice", "character"], ["bob", "artist"]]));
  });

  test("reads tag categories from the post's page", async() => {
    const { client } = setup();

    expect(await client.fetchPostPageTagCategories("42")).toEqual(new Map([["alice", "character"], ["bob", "artist"]]));
  });

  test("holds post page fetches while favorites are fetched, whether they succeed or fail", async() => {
    const { client, fetch } = setup();
    let finishFirst = (): void => { };
    let failSecond = (_error: Error): void => { };
    const first = client.prioritizeFavorites(() => new Promise<void>(resolve => {
      finishFirst = resolve;
    }));
    const second = client.prioritizeFavorites(() => new Promise<void>((_resolve, reject) => {
      failSecond = reject;
    }));
    const fetched = client.fetchPostPageTagCategories("42");

    second.catch(() => { });
    finishFirst();
    await first;
    expect(fetch).not.toHaveBeenCalled();

    failSecond(new Error("boom"));
    await fetched;
    expect(fetch).toHaveBeenCalledOnce();
  });

  test("hands back what the favorites fetch returns", async() => {
    const { client } = setup();

    expect(await client.prioritizeFavorites(() => Promise.resolve(7))).toBe(7);
  });
});
