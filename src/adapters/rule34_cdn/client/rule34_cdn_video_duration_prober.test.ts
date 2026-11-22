import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Rule34CdnVideoDurationProber } from "@/adapters/rule34_cdn/client/rule34_cdn_video_duration_prober";
import { advanceAndSettle } from "@/testing/microtask_utilities";

type Outcome = "loaded" | "error";

const VIDEO_URL = "https://ahrimp4.rule34.xxx/images//1234/a1b2c3.mp4";

interface Setup {
  rule34CdnVideoDurationProber: Rule34CdnVideoDurationProber;
  scheduler: MemoryScheduler;
}

function playOutcomes(outcomes: Outcome[]): string[] {
  const createElement = Document.prototype.createElement.bind(document);
  const loadedUrls: string[] = [];

  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    const element = createElement(tagName);
    const video = element as HTMLVideoElement;

    Object.defineProperty(element, "duration", { value: 12 });
    Object.defineProperty(element, "load", { value: (): void => undefined });
    Object.defineProperty(element, "src", {
      set(url: string): void {
        const outcome = outcomes.shift();

        loadedUrls.push(url);
        queueMicrotask(() => {
          if (outcome === "loaded") {
            video.onloadedmetadata?.(new Event("loadedmetadata"));
          } else {
            video.onerror?.(new Event("error"));
          }
        });
      }
    });
    return element;
  });
  return loadedUrls;
}

function setup(): Setup {
  const scheduler = new MemoryScheduler();
  return { rule34CdnVideoDurationProber: new Rule34CdnVideoDurationProber({ scheduler }), scheduler };
}

async function settled<T>(scheduler: MemoryScheduler, pending: Promise<T>): Promise<T> {
  pending.catch(() => { });
  await advanceAndSettle(scheduler, 1_000);
  return pending;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Rule34CdnVideoDurationProber", () => {
  describe("probeSeconds", () => {
    test("reads a video's duration from its metadata", async() => {
      const { rule34CdnVideoDurationProber, scheduler } = setup();
      const loadedUrls = playOutcomes(["loaded"]);

      expect(await settled(scheduler, rule34CdnVideoDurationProber.probeSeconds(VIDEO_URL))).toBe(12);
      expect(loadedUrls).toEqual([VIDEO_URL]);
    });

    test("rejects a video whose metadata won't load", async() => {
      const { rule34CdnVideoDurationProber, scheduler } = setup();

      playOutcomes(["error"]);

      await expect(settled(scheduler, rule34CdnVideoDurationProber.probeSeconds(VIDEO_URL))).rejects.toThrow(`Unable to probe video duration: ${VIDEO_URL}`);
    });

    test("reuses a video once its probe settles", async() => {
      const { rule34CdnVideoDurationProber, scheduler } = setup();
      const createElement = vi.spyOn(document, "createElement");

      playOutcomes(["loaded", "loaded"]);
      await settled(scheduler, rule34CdnVideoDurationProber.probeSeconds(VIDEO_URL));
      await settled(scheduler, rule34CdnVideoDurationProber.probeSeconds(VIDEO_URL));

      expect(createElement).toHaveBeenCalledOnce();
    });
  });
});
