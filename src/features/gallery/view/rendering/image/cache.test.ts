import { Mock, beforeEach, describe, expect, test, vi } from "vitest";
import { GalleryImageCache } from "@/features/gallery/view/rendering/image/cache";
import { ImageRequest } from "@/features/gallery/types/image_request";

function request(id: string): ImageRequest {
  return { id, dispose: vi.fn(), cancel: vi.fn() } as Partial<ImageRequest> as ImageRequest;
}

describe("GalleryImageCache", () => {
  let cancelFetch: Mock<(id: string) => void>;
  let cache: GalleryImageCache;

  beforeEach(() => {
    cancelFetch = vi.fn();
    cache = new GalleryImageCache(cancelFetch);
  });

  describe("sync", () => {
    test("returns every request the first time they are seen", () => {
      const requests = [request("0"), request("1")];

      expect(cache.sync(requests)).toEqual(requests);
    });

    test("returns only unseen requests on a subsequent sync", () => {
      const first = request("0");
      const second = request("1");

      cache.sync([first]);

      expect(cache.sync([first, second])).toEqual([second]);
    });

    test("evicts and releases a request no longer in the current set", () => {
      const stale = request("0");

      cache.sync([stale]);
      cache.sync([]);

      expect(cache.get("0")).toBeUndefined();
      expect(cancelFetch).toHaveBeenCalledWith("0");
      expect(stale.dispose).toHaveBeenCalledOnce();
      expect(stale.cancel).toHaveBeenCalledOnce();
    });

    test("evicts only the stale requests while keeping the ones still present", () => {
      const kept = [request("0"), request("1")];
      const stale = [request("2"), request("3")];

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
      const request0 = request("0");

      cache.storeAsLowResolution(request0);

      expect(cache.get("0")).toEqual({ request: request0, status: "low-resolution" });
    });

    test("overwrites an existing entry for the same id", () => {
      const first = request("0");
      const replacement = request("0");

      cache.storeAsComplete(first);
      cache.storeAsLowResolution(replacement);

      expect(cache.get("0")).toEqual({ request: replacement, status: "low-resolution" });
    });
  });

  describe("storeAsComplete", () => {
    test("stores the request retrievable with a complete status", () => {
      const request0 = request("0");

      cache.storeAsComplete(request0);

      expect(cache.get("0")).toEqual({ request: request0, status: "complete" });
    });

    test("overwrites an existing entry for the same id", () => {
      const first = request("0");
      const replacement = request("0");

      cache.storeAsLowResolution(first);
      cache.storeAsComplete(replacement);

      expect(cache.get("0")).toEqual({ request: replacement, status: "complete" });
    });
  });

  describe("get", () => {
    test("returns undefined for an id that was never stored", () => {
      expect(cache.get("0")).toBeUndefined();
    });

    test("returns the stored entry while leaving other ids undefined", () => {
      const request0 = request("0");

      cache.storeAsLowResolution(request0);

      expect(cache.get("0")).toEqual({ request: request0, status: "low-resolution" });
      expect(cache.get("1")).toBeUndefined();
    });
  });

  describe("completedRequests", () => {
    test("returns nothing when the cache is empty", () => {
      expect(cache.completedRequests()).toEqual([]);
    });

    test("returns only requests stored as complete", () => {
      const lowRes = request("0");
      const complete = request("1");

      cache.storeAsLowResolution(lowRes);
      cache.storeAsComplete(complete);

      expect(cache.completedRequests()).toEqual([complete]);
    });

    test("includes a request once it transitions from low-resolution to complete", () => {
      const request0 = request("0");

      cache.storeAsLowResolution(request0);
      expect(cache.completedRequests()).toEqual([]);

      cache.storeAsComplete(request0);
      expect(cache.completedRequests()).toEqual([request0]);
    });
  });
});
