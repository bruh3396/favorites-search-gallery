import { Media } from "@/core/domain/media/media";
import { MediaKind } from "@/core/domain/media/media_kind";
import { describe, expect, test, vi } from "vitest";
import { LightboxMediaCache } from "@/core/features/lightbox/stage/lightbox_media_cache";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";
import { doNothing } from "@/core/utils/function/function_utilities";
import { flushMicrotasks } from "@/testing/microtask_utilities";

interface Load {
  readonly media: Media;
  readonly signal: AbortSignal;
  readonly resolve: (value: string) => void;
  readonly reject: (error: unknown) => void;
}

function createItem(postId: string, kind: MediaKind = "image"): Post {
  return createPost({ id: postId, media: { kind, locator: postId } });
}

function setup(capacity?: number): { lightboxMediaCache: LightboxMediaCache<string>; loads: Load[]; released: string[] } {
  const loads: Load[] = [];
  const released: string[] = [];
  const lightboxMediaCache = new LightboxMediaCache<string>(
    { kind: "image", capacity },
    {
      load: (media, signal): Promise<string> => new Promise((resolve, reject) => loads.push({ media, signal, resolve, reject })),
      release: (value): number => released.push(value)
    }
  );
  return { lightboxMediaCache, loads, released };
}

describe("LightboxMediaCache", () => {
  describe("retain", () => {
    test("loads only items of its kind", () => {
      const { lightboxMediaCache, loads } = setup();

      lightboxMediaCache.retain([createItem("1"), createItem("2", "video"), createItem("3")]);
      expect(loads.map(load => load.media.locator)).toEqual(["1", "3"]);
    });

    test("loads only the first items up to its capacity", () => {
      const { lightboxMediaCache, loads } = setup(1);

      lightboxMediaCache.retain([createItem("1"), createItem("2")]);
      expect(loads.map(load => load.media.locator)).toEqual(["1"]);
    });

    test("publishes a loaded value under the item's id", async() => {
      const { lightboxMediaCache, loads } = setup();

      lightboxMediaCache.retain([createItem("1")]);
      loads[0].resolve("one");
      await flushMicrotasks();
      expect(lightboxMediaCache.loaded.value).toEqual(new Map([["1", "one"]]));
    });

    test("doesn't load an item again while it's pending or loaded", async() => {
      const { lightboxMediaCache, loads } = setup();

      lightboxMediaCache.retain([createItem("1")]);
      lightboxMediaCache.retain([createItem("1")]);
      loads[0].resolve("one");
      await flushMicrotasks();
      lightboxMediaCache.retain([createItem("1")]);
      expect(loads).toHaveLength(1);
    });

    test("evicts and releases a loaded item no longer retained", async() => {
      const { lightboxMediaCache, loads, released } = setup();

      lightboxMediaCache.retain([createItem("1")]);
      loads[0].resolve("one");
      await flushMicrotasks();
      lightboxMediaCache.retain([createItem("2")]);
      expect(lightboxMediaCache.loaded.value.has("1")).toBe(false);
      expect(released).toEqual(["one"]);
    });

    test("aborts a pending load no longer retained, and releases what it brings anyway", async() => {
      const { lightboxMediaCache, loads, released } = setup();

      lightboxMediaCache.retain([createItem("1")]);
      lightboxMediaCache.retain([]);
      expect(loads[0].signal.aborted).toBe(true);
      loads[0].resolve("one");
      await flushMicrotasks();
      expect(lightboxMediaCache.loaded.value.size).toBe(0);
      expect(released).toEqual(["one"]);
    });

    test("logs a failed load and tries again on the next retain", async() => {
      const { lightboxMediaCache, loads } = setup();
      const logError = vi.spyOn(console, "error").mockImplementation(doNothing);

      lightboxMediaCache.retain([createItem("1")]);
      loads[0].reject(new Error("offline"));
      await flushMicrotasks();
      lightboxMediaCache.retain([createItem("1")]);
      expect(logError).toHaveBeenCalledOnce();
      expect(loads).toHaveLength(2);
      logError.mockRestore();
    });

    test("stays quiet about a load that fails after being aborted", async() => {
      const { lightboxMediaCache, loads } = setup();
      const logError = vi.spyOn(console, "error").mockImplementation(doNothing);

      lightboxMediaCache.retain([createItem("1")]);
      lightboxMediaCache.retain([]);
      loads[0].reject(new Error("aborted"));
      await flushMicrotasks();
      expect(logError).not.toHaveBeenCalled();
      logError.mockRestore();
    });
  });

  describe("dispose", () => {
    test("releases everything loaded", async() => {
      const { lightboxMediaCache, loads, released } = setup();

      lightboxMediaCache.retain([createItem("1"), createItem("2")]);
      loads.forEach(load => load.resolve(load.media.locator));
      await flushMicrotasks();
      lightboxMediaCache.dispose();
      expect(lightboxMediaCache.loaded.value.size).toBe(0);
      expect(released).toEqual(["1", "2"]);
    });
  });

  test("defaults to releasing nothing", async() => {
    const loads: ((value: string) => void)[] = [];
    const lightboxMediaCache = new LightboxMediaCache<string>({ kind: "image" }, { load: (): Promise<string> => new Promise(resolve => loads.push(resolve)) });

    lightboxMediaCache.retain([createItem("1")]);
    loads[0]("one");
    await flushMicrotasks();
    expect(() => lightboxMediaCache.dispose()).not.toThrow();
  });
});
