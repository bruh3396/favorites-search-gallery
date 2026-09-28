import { afterEach, describe, expect, test, vi } from "vitest";
import { Rule34MediaClient } from "@/adapters/rule34/client/media/client";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

function setup(respond: Fetch = (): Promise<Response> => Promise.resolve(new Response("bytes"))): { client: Rule34MediaClient; fetch: ReturnType<typeof vi.fn<Fetch>> } {
  const fetch = vi.fn<Fetch>(respond);

  vi.stubGlobal("fetch", fetch);
  return { client: new Rule34MediaClient(), fetch };
}

function respondOkFor(okUrl: string): Fetch {
  return (url: string): Promise<Response> => Promise.resolve(new Response(null, { status: url === okUrl ? 200 : 404 }));
}

describe("Rule34MediaClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("addresses a preview on the thumbnail host", () => {
    expect(setup().client.previewUrl("1234/a1b2c3")).toBe("https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg");
  });

  test("addresses an original by the extension its locator carries", async() => {
    const { client, fetch } = setup();

    expect(await client.originalUrl("1234/a1b2c3.png", "gif")).toBe("https://rule34.xxx/images//1234/a1b2c3.png");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("addresses videos and gifs by their kind", async() => {
    const { client } = setup();

    expect(await client.originalUrl("1234/a1b2c3", "video")).toBe("https://rule34.xxx/images//1234/a1b2c3.mp4");
    expect(await client.originalUrl("1234/a1b2c3", "gif")).toBe("https://rule34.xxx/images//1234/a1b2c3.gif");
  });

  test("probes an image's extension once", async() => {
    const { client, fetch } = setup(respondOkFor("https://rule34.xxx/images//1234/a1b2c3.png"));

    expect(await client.originalUrl("1234/a1b2c3", "image")).toBe("https://rule34.xxx/images//1234/a1b2c3.png");
    expect(await client.originalUrl("1234/a1b2c3", "image")).toBe("https://rule34.xxx/images//1234/a1b2c3.png");
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "https://rule34.xxx/images//1234/a1b2c3.jpeg",
      "https://rule34.xxx/images//1234/a1b2c3.png"
    ]);
  });

  test("falls back to jpg when no probe finds the image", async() => {
    const { client } = setup(respondOkFor(""));

    expect(await client.originalUrl("1234/a1b2c3", "image")).toBe("https://rule34.xxx/images//1234/a1b2c3.jpg");
  });

  test("fetches a file's bytes", async() => {
    const { client } = setup();

    expect(await (await client.fetchFile("https://rule34.xxx/images//1234/a1b2c3.png")).text()).toBe("bytes");
  });

  test("rejects a file the host refuses", async() => {
    const { client } = setup(respondOkFor(""));

    await expect(client.fetchFile("https://rule34.xxx/images//1234/a1b2c3.png")).rejects.toThrow("404");
  });
});
