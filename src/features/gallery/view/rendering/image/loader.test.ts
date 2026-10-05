import { BudgetedRequests, ImageBudgeter, ImageFetcher } from "@/features/gallery/types/types";
import { describe, expect, test } from "vitest";
import { GalleryImageLoader } from "@/features/gallery/view/rendering/image/loader";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { MediaItem } from "@/core/domain/post/post";
import { flushMicrotasks } from "@/testing/async";

type FetchOutcome = (request: ImageRequest) => Promise<boolean>;

interface Setup {
  log: string[];
  createRequest: (id: string) => ImageRequest;
  createLoader: (...partitions: BudgetedRequests[]) => GalleryImageLoader;
  respondWith: (outcome: FetchOutcome) => void;
}

function createItem(id: string): MediaItem {
  return { id, media: { kind: "image", locator: "" } };
}

function describeResolution(request: ImageRequest): string {
  return request.isHighRes ? "high" : "low";
}

// A budgeter that answers each partition() with the next of the given partitions, repeating the last.
function createBudgeter(partitions: BudgetedRequests[]): ImageBudgeter {
  let call = 0;
  return {
    partition: (): BudgetedRequests => {
      const partition = partitions[Math.min(call, partitions.length - 1)];

      call += 1;
      return partition;
    }
  };
}

// Every fetch, cancel, dispose, and completion lands in `log`, in order. Fetches succeed until respondWith says otherwise.
function setup(): Setup {
  const log: string[] = [];
  let fetchOutcome: FetchOutcome = (): Promise<boolean> => Promise.resolve(true);
  const fetcher: ImageFetcher = {
    fetchBitmap: (fetched): Promise<boolean> => {
      log.push(`fetch:${fetched.id}:${describeResolution(fetched)}`);
      return fetchOutcome(fetched);
    },
    cancelFetch: (id): void => {
      log.push(`cancelFetch:${id}`);
    }
  };
  return {
    log,
    createRequest: (id: string): ImageRequest => ({
      id,
      item: createItem(id),
      isCancelled: false,
      isHighRes: true,
      dispose: () => {
        log.push(`dispose:${id}`);
        return Promise.resolve();
      },
      cancel: () => log.push(`cancel:${id}`)
    }) as Partial<ImageRequest> as ImageRequest,
    createLoader: (...partitions: BudgetedRequests[]): GalleryImageLoader => (
      new GalleryImageLoader(fetcher, createBudgeter(partitions), completed => log.push(`complete:${completed.id}:${describeResolution(completed)}`))
    ),
    respondWith: (outcome: FetchOutcome): void => {
      fetchOutcome = outcome;
    }
  };
}

describe("GalleryImageLoader", () => {
  describe("load", () => {
    test("returns the items of the rejected requests", () => {
      const { createRequest, createLoader } = setup();
      const loader = createLoader({ accepted: [createRequest("0")], rejected: [createRequest("1"), createRequest("2")] });

      expect(loader.load([])).toEqual([createItem("1"), createItem("2")]);
    });

    test("fetches each accepted request", async() => {
      const { log, createRequest, createLoader } = setup();
      const loader = createLoader({ accepted: [createRequest("0"), createRequest("1")], rejected: [] });

      loader.load([]);
      await flushMicrotasks();
      expect(log).toEqual(["fetch:0:high", "fetch:1:high", "complete:0:high", "complete:1:high"]);
    });

    test("stores a fetched high-res request as complete and notifies", async() => {
      const { log, createRequest, createLoader } = setup();
      const accepted = [createRequest("0")];
      const loader = createLoader({ accepted, rejected: [] });

      loader.load([]);
      await flushMicrotasks();
      expect(log).toEqual(["fetch:0:high", "complete:0:high"]);
      expect(loader.get("0")?.status).toBe("complete");
      expect(loader.completedRequests()).toEqual(accepted);
    });

    test("does not settle a request whose fetch fails", async() => {
      const { log, createRequest, createLoader, respondWith } = setup();
      const loader = createLoader({ accepted: [createRequest("0")], rejected: [] });

      respondWith(() => Promise.resolve(false));
      loader.load([]);
      await flushMicrotasks();
      expect(log).toEqual(["fetch:0:high"]);
      expect(loader.get("0")?.status).toBe("low-resolution");
    });

    test("disposes without notifying a request cancelled during its fetch", async() => {
      const { log, createRequest, createLoader, respondWith } = setup();
      const fetch = Promise.withResolvers<boolean>();
      const cancelled = createRequest("0");
      const loader = createLoader({ accepted: [cancelled], rejected: [] });

      respondWith(() => fetch.promise);
      loader.load([]);
      cancelled.isCancelled = true;
      fetch.resolve(true);
      await flushMicrotasks();
      expect(log).toEqual(["fetch:0:high", "dispose:0"]);
      expect(loader.get("0")?.status).toBe("low-resolution");
    });

    test("releases an evicted request, then disposes it again when its fetch settles", async() => {
      const { log, createRequest, createLoader, respondWith } = setup();
      const fetch = Promise.withResolvers<boolean>();
      const loader = createLoader({ accepted: [createRequest("0")], rejected: [] }, { accepted: [], rejected: [] });

      respondWith(() => fetch.promise);
      loader.load([]);
      loader.load([]);
      log.push("fetch resolves");
      fetch.resolve(true);
      await flushMicrotasks();
      expect(log).toEqual(["fetch:0:high", "cancelFetch:0", "dispose:0", "cancel:0", "fetch resolves", "dispose:0"]);
      expect(loader.get("0")).toBeUndefined();
    });
  });

  describe("loadImmediate", () => {
    test("stores the item as low-resolution before any fetch resolves", () => {
      const loader = setup().createLoader({ accepted: [], rejected: [] });

      loader.loadImmediate(createItem("0"));
      expect(loader.get("0")?.status).toBe("low-resolution");
    });

    test("fetches low-resolution first, then high-resolution, notifying for each", async() => {
      const { log, createLoader } = setup();
      const loader = createLoader({ accepted: [], rejected: [] });

      loader.loadImmediate(createItem("0"));
      await flushMicrotasks();
      expect(log).toEqual(["fetch:0:low", "fetch:0:high", "complete:0:low", "complete:0:high"]);
      expect(loader.get("0")?.status).toBe("complete");
    });

    test("ignores a low-resolution result that arrives after the high-resolution one", async() => {
      const { log, createLoader, respondWith } = setup();
      const lowResolutionFetch = Promise.withResolvers<boolean>();
      const loader = createLoader({ accepted: [], rejected: [] });

      respondWith(fetched => (fetched.isHighRes ? Promise.resolve(true) : lowResolutionFetch.promise));
      loader.loadImmediate(createItem("0"));
      await flushMicrotasks();
      lowResolutionFetch.resolve(true);
      await flushMicrotasks();
      expect(log).toEqual(["fetch:0:low", "fetch:0:high", "complete:0:high"]);
      expect(loader.get("0")?.status).toBe("complete");
    });
  });
});
