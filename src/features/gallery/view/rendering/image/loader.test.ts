import { BudgetedRequests, ImageBudgeter, ImageFetcher } from "@/features/gallery/types/types";
import { beforeEach, describe, expect, test } from "vitest";
import { createDeferred, flushMicrotasks } from "@/testing/async";
import { GalleryImageLoader } from "@/features/gallery/view/rendering/image/loader";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { MediaItem } from "@/types/media";

function createItem(id: string): MediaItem {
  return { id, thumbUrl: "", mediaType: "image" };
}

function resolutionOf(request: ImageRequest): string {
  return request.isHighRes ? "high" : "low";
}

describe("GalleryImageLoader", () => {
  let log: string[];
  let fetchOutcome: (request: ImageRequest) => Promise<boolean>;
  let fetcher: ImageFetcher;

  beforeEach(() => {
    log = [];
    fetchOutcome = (): Promise<boolean> => Promise.resolve(true);
    fetcher = {
      fetchBitmap: (fetched): Promise<boolean> => {
        log.push(`fetch:${fetched.id}:${resolutionOf(fetched)}`);
        return fetchOutcome(fetched);
      },
      cancelFetch: (id): void => {
        log.push(`cancelFetch:${id}`);
      }
    };
  });

  function createRequest(id: string): ImageRequest {
    return {
      id,
      item: createItem(id),
      isCancelled: false,
      isHighRes: true,
      dispose: () => {
        log.push(`dispose:${id}`);
        return Promise.resolve();
      },
      cancel: () => log.push(`cancel:${id}`)
    } as Partial<ImageRequest> as ImageRequest;
  }

  function createBudgeter(...partitions: BudgetedRequests[]): ImageBudgeter {
    let call = 0;
    return {
      partition: (): BudgetedRequests => {
        const partition = partitions[Math.min(call, partitions.length - 1)];

        call += 1;
        return partition;
      }
    };
  }

  function createLoader(budgeter: ImageBudgeter): GalleryImageLoader {
    return new GalleryImageLoader(fetcher, budgeter, completed => log.push(`complete:${completed.id}:${resolutionOf(completed)}`));
  }

  describe("load", () => {
    test("returns the items of the rejected requests", () => {
      const loader = createLoader(createBudgeter({ accepted: [createRequest("0")], rejected: [createRequest("1"), createRequest("2")] }));

      expect(loader.load([])).toEqual([createItem("1"), createItem("2")]);
    });

    test("fetches each accepted request", async() => {
      const loader = createLoader(createBudgeter({ accepted: [createRequest("0"), createRequest("1")], rejected: [] }));

      loader.load([]);
      await flushMicrotasks();

      expect(log).toEqual(["fetch:0:high", "fetch:1:high", "complete:0:high", "complete:1:high"]);
    });

    test("stores a fetched high-res request as complete and notifies", async() => {
      const accepted = [createRequest("0")];
      const loader = createLoader(createBudgeter({ accepted, rejected: [] }));

      loader.load([]);
      await flushMicrotasks();

      expect(log).toEqual(["fetch:0:high", "complete:0:high"]);
      expect(loader.get("0")?.status).toBe("complete");
      expect(loader.completedRequests()).toEqual(accepted);
    });

    test("does not settle a request whose fetch fails", async() => {
      fetchOutcome = (): Promise<boolean> => Promise.resolve(false);
      const loader = createLoader(createBudgeter({ accepted: [createRequest("0")], rejected: [] }));

      loader.load([]);
      await flushMicrotasks();

      expect(log).toEqual(["fetch:0:high"]);
      expect(loader.get("0")?.status).toBe("low-resolution");
    });

    test("disposes without notifying a request cancelled during its fetch", async() => {
      const fetch = createDeferred<boolean>();
      const cancelled = createRequest("0");
      const loader = createLoader(createBudgeter({ accepted: [cancelled], rejected: [] }));

      fetchOutcome = (): Promise<boolean> => fetch.promise;
      loader.load([]);
      cancelled.isCancelled = true;
      fetch.resolve(true);
      await flushMicrotasks();

      expect(log).toEqual(["fetch:0:high", "dispose:0"]);
      expect(loader.get("0")?.status).toBe("low-resolution");
    });

    test("releases an evicted request, then disposes it again when its fetch settles", async() => {
      const fetch = createDeferred<boolean>();
      const loader = createLoader(createBudgeter({ accepted: [createRequest("0")], rejected: [] }, { accepted: [], rejected: [] }));

      fetchOutcome = (): Promise<boolean> => fetch.promise;
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
      const loader = createLoader(createBudgeter({ accepted: [], rejected: [] }));

      loader.loadImmediate(createItem("0"));

      expect(loader.get("0")?.status).toBe("low-resolution");
    });

    test("fetches low-resolution first, then high-resolution, notifying for each", async() => {
      const loader = createLoader(createBudgeter({ accepted: [], rejected: [] }));

      loader.loadImmediate(createItem("0"));
      await flushMicrotasks();

      expect(log).toEqual(["fetch:0:low", "fetch:0:high", "complete:0:low", "complete:0:high"]);
      expect(loader.get("0")?.status).toBe("complete");
    });

    test("ignores a low-resolution result that arrives after the high-resolution one", async() => {
      const lowResolutionFetch = createDeferred<boolean>();
      const loader = createLoader(createBudgeter({ accepted: [], rejected: [] }));

      fetchOutcome = (fetched): Promise<boolean> => (fetched.isHighRes ? Promise.resolve(true) : lowResolutionFetch.promise);
      loader.loadImmediate(createItem("0"));
      await flushMicrotasks();
      lowResolutionFetch.resolve(true);
      await flushMicrotasks();

      expect(log).toEqual(["fetch:0:low", "fetch:0:high", "complete:0:high"]);
      expect(loader.get("0")?.status).toBe("complete");
    });
  });
});
