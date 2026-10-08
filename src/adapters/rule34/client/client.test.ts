import { Mock, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34Error } from "@/adapters/rule34/client/error";
import { postPageUrl } from "@/adapters/rule34/client/post_page";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

type KeepPaginator = (pageIndex: number, paginator: HTMLElement | null) => void;

interface Setup {
  client: Rule34Client;
  fetch: Mock<Fetch>;
  keepPaginator: Mock<KeepPaginator>;
}

interface DocumentOptions {
  isFirstFavoritesPage?: boolean;
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

function createThumb(id: string): string {
  return `<span class="thumb" id="s${id}"><a id="p${id}"><img src="https://example.com/thumbnail_${id}.jpg" title="apple"></a></span>`;
}

function setup(
  respond: Fetch = (): Promise<Response> => Promise.resolve(new Response(POST_PAGE)),
  { isFirstFavoritesPage = false }: DocumentOptions = {}
): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const keepPaginator = vi.fn<KeepPaginator>();
  const mintMedia = ({ url }: { url: string }): Media => ({ kind: "image", locator: url });
  const rule34Document = { isFirstFavoritesPage: (): boolean => isFirstFavoritesPage, keepPaginator };
  const dependencies = { fetch, scheduler: new MemoryScheduler(), randomSource: new MemoryRandomSource(), mintMedia, rule34Document };
  return { client: new Rule34Client(dependencies), fetch, keepPaginator };
}

describe("Rule34Client", () => {
  // The browser opened a page holding one post and a paginator.
  beforeEach(() => {
    document.body.innerHTML = `${createThumb("1")}<div id="paginator">landing</div>`;
  });

  afterEach(() => {
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

    test("hands the fetched page's paginator to the document", async() => {
      const { client, keepPaginator } = setup(() => Promise.resolve(new Response(`${createThumb("7")}<div id="paginator">fetched</div>`)));

      await client.fetchPostListPage("apple", 2);
      expect(keepPaginator).toHaveBeenCalledWith(2, expect.objectContaining({ textContent: "fetched" }));
    });
  });

  describe("readPostListPage", () => {
    test("reads the posts on the page the browser opened", () => {
      expect(setup().client.readPostListPage(0).map(post => post.id)).toEqual(["1"]);
    });

    test("hands the opened page's paginator to the document", () => {
      const { client, keepPaginator } = setup();

      client.readPostListPage(0);
      expect(keepPaginator).toHaveBeenCalledWith(0, expect.objectContaining({ textContent: "landing" }));
    });
  });

  describe("readFirstFavoritesPage", () => {
    test("reads the favorites on the page the browser opened", () => {
      const { client } = setup(undefined, { isFirstFavoritesPage: true });

      expect(client.readFirstFavoritesPage()?.map(post => post.id)).toEqual(["1"]);
    });

    test("reads nothing past the first favorites page", () => {
      expect(setup().client.readFirstFavoritesPage()).toBeNull();
    });

    test("reads nothing once the page holds no favorites", () => {
      const { client } = setup(undefined, { isFirstFavoritesPage: true });

      document.body.replaceChildren();
      expect(client.readFirstFavoritesPage()).toBeNull();
    });
  });
});
