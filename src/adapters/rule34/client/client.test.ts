import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34Error } from "@/adapters/rule34/client/error";
import { postPageUrl } from "@/adapters/rule34/client/post_page";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

interface Setup {
  client: Rule34Client;
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

const replaceState = vi.fn<History["replaceState"]>();

function createThumb(id: string): string {
  return `<span class="thumb" id="s${id}"><a id="p${id}"><img src="https://example.com/thumbnail_${id}.jpg" title="apple"></a></span>`;
}

function readPaginatorText(): string | null | undefined {
  return document.querySelector("#paginator")?.textContent;
}

function readAddressOffset(): string | null {
  return new URL(String(replaceState.mock.lastCall?.[2])).searchParams.get("pid");
}

function setup(respond: Fetch = (): Promise<Response> => Promise.resolve(new Response(POST_PAGE))): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const mintMedia = ({ url }: { url: string }): Media => ({ kind: "image", locator: url });
  const dependencies = { fetch, scheduler: new MemoryScheduler(), randomSource: new MemoryRandomSource(), mintMedia };
  return { client: new Rule34Client(dependencies, { run: request => request() }), fetch };
}

describe("Rule34Client", () => {
  // The browser opened the first page of a search for apple.
  beforeEach(() => {
    vi.stubGlobal("location", { href: "https://rule34.xxx/index.php?page=post&s=list&tags=apple" });
    vi.stubGlobal("history", { replaceState });
    document.body.innerHTML = `${createThumb("1")}<div id="paginator">landing</div>`;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    replaceState.mockReset();
    document.body.replaceChildren();
  });

  describe("fetchPostPage", () => {
    test("reads a post and its tag categories from the post's page", async() => {
      const { client, fetch } = setup();
      const { post, tagCategories } = await client.fetchPostPage("42");

      expect(fetch).toHaveBeenCalledWith(postPageUrl("42"), undefined);
      expect(post).toMatchObject({ id: "42", width: 1_920, height: 1_080, deleted: true });
      expect(tagCategories).toEqual(new Map([["alice", "character"], ["bob", "artist"]]));
    });

    test("names a page the host refuses", async() => {
      const { client } = setup(() => Promise.resolve(new Response(null, { status: 503 })));

      await expect(client.fetchPostPage("42")).rejects.toMatchObject({ reason: "http", status: 503 });
    });

    test("names a page it can't read", async() => {
      const { client } = setup(() => Promise.resolve(new Response("<html></html>")));

      await expect(client.fetchPostPage("42")).rejects.toThrow(Rule34Error);
    });
  });

  describe("prioritizeFavorites", () => {
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

    test("hands back what the favorites fetch returns", async() => {
      const { client } = setup();

      expect(await client.prioritizeFavorites(() => Promise.resolve(7))).toBe(7);
    });
  });

  describe("fetchPostListPage", () => {
    test("fetches a page of a search and reads its posts", async() => {
      const { client, fetch } = setup(() => Promise.resolve(new Response(createThumb("7"))));

      expect((await client.fetchPostListPage("apple", 2)).map(post => post.id)).toEqual(["7"]);
      expect(fetch).toHaveBeenCalledWith("https://rule34.xxx/index.php?page=post&s=list&tags=apple&pid=84", undefined);
    });
  });

  describe("readPostListPage", () => {
    test("reads the posts on the page the browser opened", () => {
      expect(setup().client.readPostListPage(0).map(post => post.id)).toEqual(["1"]);
    });
  });

  describe("reflectPostListPage", () => {
    test("reflects a fetched page on the paginator and address, then the opened page again", async() => {
      const { client } = setup(() => Promise.resolve(new Response(`${createThumb("7")}<div id="paginator">fetched</div>`)));

      client.readPostListPage(0);
      await client.fetchPostListPage("apple", 2);
      client.reflectPostListPage(2);
      expect([readPaginatorText(), readAddressOffset()]).toEqual(["fetched", "84"]);
      client.reflectPostListPage(0);
      expect([readPaginatorText(), readAddressOffset()]).toEqual(["landing", "0"]);
    });

    test("still rewrites the address for a page whose paginator it never saw", () => {
      setup().client.reflectPostListPage(5);
      expect([readPaginatorText(), readAddressOffset()]).toEqual(["landing", "210"]);
    });
  });

  describe("setPaginatorVisible", () => {
    test("hides the paginator", () => {
      const { client } = setup();

      client.setPaginatorVisible(false);
      expect(document.querySelector<HTMLElement>("#paginator")?.style.display).toBe("none");
    });
  });
});
