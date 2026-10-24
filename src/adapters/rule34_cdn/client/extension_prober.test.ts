import { describe, expect, test, vi } from "vitest";
import { MediaKind } from "@/core/domain/media/media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34CdnExtensionProber } from "@/adapters/rule34_cdn/client/extension_prober";
import { advanceAndSettle } from "@/testing/async";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

interface Setup {
  fetch: ReturnType<typeof vi.fn<Fetch>>;
  probe: (locator: string, guess?: MediaKind) => Promise<string | null>;
}

function setup(respond: Fetch): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const scheduler = new MemoryScheduler();
  const prober = new Rule34CdnExtensionProber({ fetch, scheduler });
  const probe = async(locator: string, guess: MediaKind = "image"): Promise<string | null> => {
    const pending = prober.probe(locator, guess);

    await advanceAndSettle(scheduler, 1_000);
    return pending;
  };
  return { fetch, probe };
}

function createFetchFindingOnly(okUrl: string): Fetch {
  return (url: string): Promise<Response> => Promise.resolve(new Response(null, { status: url === okUrl ? 200 : 404 }));
}

function probedExtensions(fetch: Setup["fetch"]): string[] {
  return fetch.mock.calls.map(([url]) => url.split(".").at(-1) ?? "");
}

describe("Rule34CdnExtensionProber", () => {
  describe("probe", () => {
    test("asks the host with HEAD requests until one finds the file", async() => {
      const { fetch, probe } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.png"));

      expect(await probe("1234/a1b2c3")).toBe("png");
      expect(fetch.mock.calls).toEqual([
        ["https://rule34.xxx/images//1234/a1b2c3.jpeg", { method: "HEAD" }],
        ["https://rule34.xxx/images//1234/a1b2c3.png", { method: "HEAD" }]
      ]);
    });

    test("finds a gif behind an image guess", async() => {
      const { fetch, probe } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.gif"));

      expect(await probe("1234/a1b2c3", "image")).toBe("gif");
      expect(probedExtensions(fetch)).toEqual(["jpeg", "png", "jpg", "gif"]);
    });

    test("finds a video behind an image guess", async() => {
      const { probe } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.mp4"));

      expect(await probe("1234/a1b2c3", "image")).toBe("mp4");
    });

    test("tries the guessed kind's extension first", async() => {
      const { fetch, probe } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.mp4"));

      expect(await probe("1234/a1b2c3", "gif")).toBe("mp4");
      expect(probedExtensions(fetch)).toEqual(["gif", "mp4"]);
    });

    test("remembers a found extension", async() => {
      const { fetch, probe } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.jpeg"));

      await probe("1234/a1b2c3");
      expect(await probe("1234/a1b2c3")).toBe("jpeg");
      expect(fetch).toHaveBeenCalledOnce();
    });

    test("shares a probe that is still running", async() => {
      const { fetch, probe } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.png"));

      expect(await Promise.all([probe("1234/a1b2c3"), probe("1234/a1b2c3")])).toEqual(["png", "png"]);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test("returns null when no extension is found", async() => {
      const { probe } = setup(createFetchFindingOnly(""));

      expect(await probe("1234/a1b2c3")).toBeNull();
    });

    test("probes again after finding nothing", async() => {
      const { fetch, probe } = setup(createFetchFindingOnly(""));

      await probe("1234/a1b2c3");
      await probe("1234/a1b2c3");
      expect(fetch).toHaveBeenCalledTimes(10);
    });

    test("treats a failed request as a miss", async() => {
      const { probe } = setup(url => (url.endsWith(".jpeg") ? Promise.reject(new TypeError("offline")) : createFetchFindingOnly(url)(url)));

      expect(await probe("1234/a1b2c3")).toBe("png");
    });
  });
});
