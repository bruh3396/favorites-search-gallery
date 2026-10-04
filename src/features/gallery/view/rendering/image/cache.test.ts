import { Mock, describe, expect, test, vi } from "vitest";
import { GalleryImageCache } from "@/features/gallery/view/rendering/image/cache";
import { ImageRequest } from "@/features/gallery/types/image_request";

interface Setup {
  cache: GalleryImageCache;
  cancelFetch: Mock<(id: string) => void>;
}

function setup(): Setup {
  const cancelFetch = vi.fn<(id: string) => void>();
  return { cache: new GalleryImageCache(cancelFetch), cancelFetch };
}

function createRequest(id: string): ImageRequest {
  return { id, dispose: vi.fn(), cancel: vi.fn() } as Partial<ImageRequest> as ImageRequest;
}

describe("GalleryImageCache", () => {
  describe("sync", () => {
    test("returns every request the first time they are seen", () => {
      const requests = [createRequest("0"), createRequest("1")];

      expect(setup().cache.sync(requests)).toEqual(requests);
    });

    test("returns only unseen requests on a subsequent sync", () => {
      const { cache } = setup();
      const first = createRequest("0");
      const second = createRequest("1");

      cache.sync([first]);
      expect(cache.sync([first, second])).toEqual([second]);
    });

    test("evicts and releases a request no longer in the current set", () => {
      const { cache, cancelFetch } = setup();
      const stale = createRequest("0");

      cache.sync([stale]);
      cache.sync([]);
      expect(cache.get("0")).toBeUndefined();
      expect(cancelFetch).toHaveBeenCalledWith("0");
      expect(stale.dispose).toHaveBeenCalledOnce();
      expect(stale.cancel).toHaveBeenCalledOnce();
    });

    test("evicts only the stale requests while keeping the ones still present", () => {
      const { cache, cancelFetch } = setup();
      const kept = [createRequest("0"), createRequest("1")];
      const stale = [createRequest("2"), createRequest("3")];

      cache.sync([...kept, ...stale]);
      cache.sync(kept);
      expect(cache.get("0")).toEqual({ request: kept[0], status: "low-resolution" });
      expect(cache.get("1")).toEqual({ request: kept[1], status: "low-resolution" });
      expect(cache.get("2")).toBeUndefined();
      expect(cache.get("3")).toBeUndefined();
      expect(cancelFetch.mock.calls).toEqual([["2"], ["3"]]);
      stale.forEach(r => {
        expect(r.dispose).toHaveBeenCalledOnce();
        expect(r.cancel).toHaveBeenCalledOnce();
      });
      kept.forEach(r => {
        expect(r.dispose).not.toHaveBeenCalled();
        expect(r.cancel).not.toHaveBeenCalled();
      });
    });
  });

  describe("storeAsLowResolution", () => {
    test("stores the request retrievable with a low-resolution status", () => {
      const { cache } = setup();
      const request = createRequest("0");

      cache.storeAsLowResolution(request);
      expect(cache.get("0")).toEqual({ request, status: "low-resolution" });
    });

    test("overwrites an existing entry for the same id", () => {
      const { cache } = setup();
      const replacement = createRequest("0");

      cache.storeAsComplete(createRequest("0"));
      cache.storeAsLowResolution(replacement);
      expect(cache.get("0")).toEqual({ request: replacement, status: "low-resolution" });
    });
  });

  describe("storeAsComplete", () => {
    test("stores the request retrievable with a complete status", () => {
      const { cache } = setup();
      const request = createRequest("0");

      cache.storeAsComplete(request);
      expect(cache.get("0")).toEqual({ request, status: "complete" });
    });

    test("overwrites an existing entry for the same id", () => {
      const { cache } = setup();
      const replacement = createRequest("0");

      cache.storeAsLowResolution(createRequest("0"));
      cache.storeAsComplete(replacement);
      expect(cache.get("0")).toEqual({ request: replacement, status: "complete" });
    });
  });

  describe("get", () => {
    test("returns undefined for an id that was never stored", () => {
      expect(setup().cache.get("0")).toBeUndefined();
    });

    test("returns the stored entry while leaving other ids undefined", () => {
      const { cache } = setup();
      const request = createRequest("0");

      cache.storeAsLowResolution(request);
      expect(cache.get("0")).toEqual({ request, status: "low-resolution" });
      expect(cache.get("1")).toBeUndefined();
    });
  });

  describe("completedRequests", () => {
    test("returns nothing when the cache is empty", () => {
      expect(setup().cache.completedRequests()).toEqual([]);
    });

    test("returns only requests stored as complete", () => {
      const { cache } = setup();
      const complete = createRequest("1");

      cache.storeAsLowResolution(createRequest("0"));
      cache.storeAsComplete(complete);
      expect(cache.completedRequests()).toEqual([complete]);
    });

    test("includes a request once it transitions from low-resolution to complete", () => {
      const { cache } = setup();
      const request = createRequest("0");

      cache.storeAsLowResolution(request);
      expect(cache.completedRequests()).toEqual([]);
      cache.storeAsComplete(request);
      expect(cache.completedRequests()).toEqual([request]);
    });
  });
});
