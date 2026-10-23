import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34CdnExtensionProber } from "@/adapters/rule34_cdn/client/extension_prober";
import { advanceAndSettle } from "@/testing/async";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

interface Setup {
  prober: Rule34CdnExtensionProber;
  fetch: ReturnType<typeof vi.fn<Fetch>>;
  probe: (locator: string) => Promise<string>;
}

function setup(respond: Fetch): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const scheduler = new MemoryScheduler();
  const prober = new Rule34CdnExtensionProber({ fetch, scheduler });
  const probe = async(locator: string): Promise<string> => {
    const pending = prober.probe(locator);

    await advanceAndSettle(scheduler, 1_000);
    return pending;
  };
  return { prober, fetch, probe };
}

function createFetchFindingOnly(okUrl: string): Fetch {
  return (url: string): Promise<Response> => Promise.resolve(new Response(null, { status: url === okUrl ? 200 : 404 }));
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

    test("remembers a found extension", async() => {
      const { fetch, probe } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.jpeg"));

      await probe("1234/a1b2c3");
      expect(await probe("1234/a1b2c3")).toBe("jpeg");
      expect(fetch).toHaveBeenCalledOnce();
    });

    test("falls back to jpg when no extension is found", async() => {
      const { probe } = setup(createFetchFindingOnly(""));

      expect(await probe("1234/a1b2c3")).toBe("jpg");
    });

    test("probes again after a fallback", async() => {
      const { fetch, probe } = setup(createFetchFindingOnly(""));

      await probe("1234/a1b2c3");
      await probe("1234/a1b2c3");
      expect(fetch).toHaveBeenCalledTimes(6);
    });

    test("treats a failed request as a miss", async() => {
      const { probe } = setup(url => (url.endsWith(".jpeg") ? Promise.reject(new TypeError("offline")) : createFetchFindingOnly(url)(url)));

      expect(await probe("1234/a1b2c3")).toBe("png");
    });
  });
});
