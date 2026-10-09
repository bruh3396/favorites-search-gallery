import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34CdnVideoDurationReader } from "@/adapters/rule34_cdn/client/video_duration";
import { advanceAndSettle } from "@/testing/async";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
type Outcome = "loaded" | "error";

const VIDEO_URL = "https://rule34.xxx/images//1234/a1b2c3.mp4";

interface Setup {
  reader: Rule34CdnVideoDurationReader;
  fetch: ReturnType<typeof vi.fn<Fetch>>;
  scheduler: MemoryScheduler;
}

function respondPartially(): Promise<Response> {
  return Promise.resolve(new Response("bytes", { status: 206 }));
}

// Each video the reader creates settles with the next outcome, reporting a duration of 12 seconds once loaded.
function playOutcomes(outcomes: Outcome[]): void {
  const createElement = Document.prototype.createElement.bind(document);

  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    const element = createElement(tagName);

    Object.defineProperty(element, "duration", { value: 12 });
    Object.defineProperty(element, "src", {
      set(): void {
        const outcome = outcomes.shift();
        const video = element as HTMLVideoElement;

        queueMicrotask(() => {
          if (outcome === "loaded") {
            video.onloadedmetadata?.(new Event("loadedmetadata"));
          } else {
            video.onerror?.(new Event("error"));
          }
        });
      },
      get: (): string => "blob:video"
    });
    return element;
  });
}

function setup(respond: Fetch = respondPartially): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const scheduler = new MemoryScheduler();
  return { reader: new Rule34CdnVideoDurationReader({ fetch, scheduler }), fetch, scheduler };
}

async function settled<T>(scheduler: MemoryScheduler, pending: Promise<T>): Promise<T> {
  pending.catch(() => { });
  await advanceAndSettle(scheduler, 1_000);
  return pending;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Rule34CdnVideoDurationReader", () => {
  describe("readSeconds", () => {
    test("reads a video's duration from the start of its file", async() => {
      const { reader, fetch, scheduler } = setup();

      playOutcomes(["loaded"]);

      expect(await settled(scheduler, reader.readSeconds(VIDEO_URL))).toBe(12);
      expect(fetch).toHaveBeenCalledWith(VIDEO_URL, { headers: { Range: "bytes=0-500000" } });
    });

    test("reads a longer range when the metadata won't load from a shorter one", async() => {
      const { reader, fetch, scheduler } = setup();

      playOutcomes(["error", "error", "loaded"]);

      expect(await settled(scheduler, reader.readSeconds(VIDEO_URL))).toBe(12);
      expect(fetch.mock.calls.map(([, init]) => init?.headers)).toEqual([
        { Range: "bytes=0-500000" },
        { Range: "bytes=0-1000000" },
        { Range: "bytes=0-2000000" }
      ]);
    });

    test("accepts a whole file the host serves", async() => {
      const { reader, scheduler } = setup(() => Promise.resolve(new Response("bytes")));

      playOutcomes(["loaded"]);

      expect(await settled(scheduler, reader.readSeconds(VIDEO_URL))).toBe(12);
    });

    test("rejects once every range fails", async() => {
      const { reader, fetch, scheduler } = setup();

      playOutcomes(["error", "error", "error", "error"]);

      await expect(settled(scheduler, reader.readSeconds(VIDEO_URL))).rejects.toThrow(`Unable to read video duration: ${VIDEO_URL}`);
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    test("rejects a video the host refuses", async() => {
      const { reader, scheduler } = setup(() => Promise.resolve(new Response(null, { status: 404 })));

      await expect(settled(scheduler, reader.readSeconds(VIDEO_URL))).rejects.toThrow("Unable to read video duration");
    });

    test("reuses a video once its read settles", async() => {
      const { reader, scheduler } = setup();
      const createElement = vi.spyOn(document, "createElement");

      playOutcomes(["loaded", "loaded"]);
      await settled(scheduler, reader.readSeconds(VIDEO_URL));
      await settled(scheduler, reader.readSeconds(VIDEO_URL));

      expect(createElement).toHaveBeenCalledOnce();
    });
  });
});
