import { describe, expect, test, vi } from "vitest";
// import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { advanceAndSettle } from "@/testing/async";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
type FetchMock = ReturnType<typeof vi.fn<Fetch>>;

function respondWithBytes(): Promise<Response> {
  return Promise.resolve(new Response("bytes"));
}

interface Setup {
  client: Rule34CdnClient;
  fetch: FetchMock;
  scheduler: MemoryScheduler;
}

function setup(respond: Fetch = respondWithBytes): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const scheduler = new MemoryScheduler();
  return { client: new Rule34CdnClient({ fetch, scheduler }), fetch, scheduler };
}

async function settled<T>(scheduler: MemoryScheduler, pending: Promise<T>): Promise<T> {
  await advanceAndSettle(scheduler, 1_000);
  return pending;
}

function createFetchFindingOnly(okUrl: string): Fetch {
  return (url: string): Promise<Response> => Promise.resolve(new Response(null, { status: url === okUrl ? 200 : 404 }));
}

// TODO resolve cdn host logic
describe("Rule34CdnClient", () => {
  test("mints media from a file url", () => {
    expect(setup().client.mintMedia({ url: "https://api-cdn.rule34.xxx/images/1234/a1b2c3.mp4", tags: "" }))
      .toEqual({ kind: "video", locator: "1234/a1b2c3.mp4" });
  });

//   test("addresses a preview on the thumbnail host", () => {
//     expect(setup().client.previewUrl("1234/a1b2c3"))
//       .toBe("https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg");
//   });

//   test("addresses an original by the extension its locator carries", async() => {
//     const { client, fetch } = setup();

//     expect(await client.originalUrl("1234/a1b2c3.png", "gif")).toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.png");
//     expect(fetch).not.toHaveBeenCalled();
//   });

//   test("addresses videos and gifs by their kind", async() => {
//     const { client } = setup();

//     expect(await client.originalUrl("1234/a1b2c3", "video")).toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.mp4");
//     expect(await client.originalUrl("1234/a1b2c3", "gif")).toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.gif");
//   });

//   test("addresses a video's image as the jpg beside it", async() => {
//     const { client, fetch } = setup();

//     expect(await client.imageUrl("1234/a1b2c3.mp4", "video")).toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.jpg");
//     expect(fetch).not.toHaveBeenCalled();
//   });

//   test("addresses an image's or gif's image as its original", async() => {
//     const { client } = setup();

//     expect(await client.imageUrl("1234/a1b2c3.png", "image")).toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.png");
//     expect(await client.imageUrl("1234/a1b2c3", "gif")).toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.gif");
//   });

//   test("probes an image's extension once", async() => {
//     const { client, fetch, scheduler } = setup(createFetchFindingOnly("https://wimg.rule34.xxx/images//1234/a1b2c3.png"));
//     const original = "https://wimg.rule34.xxx/images//1234/a1b2c3.png";

//     expect(await settled(scheduler, client.originalUrl("1234/a1b2c3", "image"))).toBe(original);
//     expect(await settled(scheduler, client.originalUrl("1234/a1b2c3", "image"))).toBe(original);
//     expect(fetch.mock.calls.map(([url]) => url)).toEqual([
//       "https://wimg.rule34.xxx/images//1234/a1b2c3.jpeg",
//       "https://wimg.rule34.xxx/images//1234/a1b2c3.png"
//     ]);
//   });

//   test("falls back to jpg when no probe finds the image", async() => {
//     const { client, scheduler } = setup(createFetchFindingOnly(""));

//     expect(await settled(scheduler, client.originalUrl("1234/a1b2c3", "image")))
//       .toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.jpg");
//   });

//   test("treats a probe the network fails as a miss", async() => {
//     const { client, scheduler } = setup(() => Promise.reject(new TypeError("offline")));

//     expect(await settled(scheduler, client.originalUrl("1234/a1b2c3", "image")))
//       .toBe("https://wimg.rule34.xxx/images//1234/a1b2c3.jpg");
//   });

//   test("rejects a video duration the host won't serve", async() => {
//     const { client, scheduler } = setup(createFetchFindingOnly(""));
//     const duration = client.readVideoDurationSeconds("https://wimg.rule34.xxx/images//1234/a1b2c3.mp4");

//     duration.catch(() => { });
//     await expect(settled(scheduler, duration)).rejects.toThrow("Unable to read video duration");
//   });

//   test("fetches a file's bytes", async() => {
//     const { client } = setup();

//     expect(await (await client.fetchFile("https://wimg.rule34.xxx/images//1234/a1b2c3.png")).text()).toBe("bytes");
//   });

//   test("rejects a file the host refuses", async() => {
//     const { client } = setup(createFetchFindingOnly(""));

//     await expect(client.fetchFile("https://wimg.rule34.xxx/images//1234/a1b2c3.png")).rejects.toThrow("404");
//   });
});
