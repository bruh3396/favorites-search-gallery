import { ImageBudgeter, ImageFetcher } from "@/features/gallery/types/types";
import { Mock, beforeEach, describe, expect, test, vi } from "vitest";
import { GalleryImageLoader } from "@/features/gallery/view/rendering/image/loader";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { MediaItem } from "@/types/media";

function item(id: string): MediaItem {
  return { id, thumbUrl: "", mediaType: "image" };
}

function request(id: string, overrides: Partial<ImageRequest> = {}): ImageRequest {
  return {
    id,
    item: item(id),
    isCancelled: false,
    isHighRes: true,
    dispose: vi.fn(),
    cancel: vi.fn(),
    ...overrides
  } as Partial<ImageRequest> as ImageRequest;
}

function budgeterReturning(accepted: ImageRequest[], rejected: ImageRequest[]): ImageBudgeter {
  return { partition: () => ({ accepted, rejected }) };
}

function flush(): Promise<void> {
  return Promise.resolve();
}

describe("GalleryImageLoader", () => {
  let fetchBitmap: Mock<(request: ImageRequest) => Promise<boolean>>;
  let cancelFetch: Mock<(id: string) => void>;
  let onRequestCompleted: Mock<(request: ImageRequest) => void>;
  let fetcher: ImageFetcher;

  beforeEach(() => {
    fetchBitmap = vi.fn().mockResolvedValue(true);
    cancelFetch = vi.fn();
    onRequestCompleted = vi.fn();
    fetcher = { fetchBitmap, cancelFetch };
  });

  function createLoader(budgeter: ImageBudgeter): GalleryImageLoader {
    return new GalleryImageLoader(fetcher, budgeter, onRequestCompleted);
  }

  describe("load", () => {
    test("returns the items of the rejected requests", () => {
      const loader = createLoader(budgeterReturning([request("0")], [request("1"), request("2")]));

      expect(loader.load([])).toEqual([item("1"), item("2")]);
    });

    test("fetches each accepted request", async() => {
      const loader = createLoader(budgeterReturning([request("0"), request("1")], []));

      loader.load([]);
      await flush();

      expect(fetchBitmap).toHaveBeenCalledTimes(2);
    });

    test("stores a fetched high-res request as complete and notifies", async() => {
      const accepted = [request("0")];
      const loader = createLoader(budgeterReturning(accepted, []));

      loader.load([]);
      await flush();

      expect(loader.get("0")?.status).toBe("complete");
      expect(loader.completedRequests()).toEqual(accepted);
      expect(onRequestCompleted).toHaveBeenCalledWith(accepted[0]);
    });

    test("does not settle a request whose fetch fails", async() => {
      fetchBitmap.mockResolvedValue(false);
      const loader = createLoader(budgeterReturning([request("0")], []));

      loader.load([]);
      await flush();

      expect(loader.get("0")?.status).toBe("low-resolution");
      expect(onRequestCompleted).not.toHaveBeenCalled();
    });

    test("disposes without notifying a request cancelled during its fetch", async() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let resolveFetch = (_success: boolean): void => { };

      fetchBitmap.mockReturnValue(new Promise(resolve => {
        resolveFetch = resolve;
      }));
      const cancelled = request("0");
      const loader = createLoader(budgeterReturning([cancelled], []));

      loader.load([]);
      cancelled.isCancelled = true;
      resolveFetch(true);
      await flush();

      expect(cancelled.dispose).toHaveBeenCalledOnce();
      expect(loader.get("0")?.status).toBe("low-resolution");
      expect(onRequestCompleted).not.toHaveBeenCalled();
    });

    test("disposes without notifying a request evicted during its fetch", async() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let resolveFetch = (_success: boolean): void => { };

      fetchBitmap.mockReturnValueOnce(new Promise(resolve => {
        resolveFetch = resolve;
      }));
      const evicted = request("0");
      const budgeter = { partition: vi.fn() };

      budgeter.partition.mockReturnValueOnce({ accepted: [evicted], rejected: [] });
      budgeter.partition.mockReturnValueOnce({ accepted: [], rejected: [] });
      const loader = new GalleryImageLoader(fetcher, budgeter, onRequestCompleted);

      loader.load([]);
      loader.load([]);
      resolveFetch(true);
      await flush();

      // Disposed twice: once by eviction's release, once by settle finding it gone.
      expect(evicted.dispose).toHaveBeenCalledTimes(2);
      expect(loader.get("0")).toBeUndefined();
      expect(onRequestCompleted).not.toHaveBeenCalled();
    });
  });

  describe("loadImmediate", () => {
    test("stores the item as low-resolution before any fetch resolves", () => {
      const loader = createLoader(budgeterReturning([], []));

      loader.loadImmediate(item("0"));

      expect(loader.get("0")?.status).toBe("low-resolution");
    });

    test("fetches both a low-resolution and a high-resolution request for the item", async() => {
      const loader = createLoader(budgeterReturning([], []));

      loader.loadImmediate(item("0"));
      await flush();

      const fetched = fetchBitmap.mock.calls.map(([r]) => r);

      expect(fetched).toHaveLength(2);
      expect(fetched.map(r => r.id)).toEqual(["0", "0"]);
      expect(fetched.map(r => r.isHighRes).sort()).toEqual([false, true]);
    });

    test("ends complete once the high-resolution fetch settles", async() => {
      const loader = createLoader(budgeterReturning([], []));

      loader.loadImmediate(item("0"));
      await flush();

      expect(loader.get("0")?.status).toBe("complete");
      expect(onRequestCompleted).toHaveBeenCalled();
    });
  });
});
