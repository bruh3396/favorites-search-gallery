import { describe, expect, test, vi } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";
import { LightboxRetentionList } from "@/core/features/lightbox/retention_list/lightbox_retention_list";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPosts } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";

const POSTS = createPosts("1", "2", "3", "4");

function setup(capacity: number): {
  lightboxRetentionList: LightboxRetentionList<Post>;
  settled: Emitter<Post>;
  sequence: Signal<MediaSequence<Post> | undefined>;
  getNeighbors: ReturnType<typeof vi.fn<MediaSequence<Post>["getNeighbors"]>>;
} {
  const settled = new Emitter<Post>();
  const getNeighbors = vi.fn<MediaSequence<Post>["getNeighbors"]>(() => Promise.resolve([POSTS[1], POSTS[2]]));
  const sequence = new Signal<MediaSequence<Post> | undefined>({
    getNext: vi.fn(),
    getPrevious: vi.fn(),
    getNeighbors,
    positionOf: vi.fn()
  });
  return { lightboxRetentionList: new LightboxRetentionList<Post>({ capacity }, { settled, sequence }), settled, sequence, getNeighbors };
}

describe("LightboxRetentionList", () => {
  test("starts empty", () => {
    expect(setup(2).lightboxRetentionList.items.value).toEqual([]);
  });

  test("retains a settled item and as many of its neighbours as fit", async() => {
    const { lightboxRetentionList, settled, getNeighbors } = setup(3);

    settled.emit(POSTS[0]);
    await flushMicrotasks();
    expect(getNeighbors).toHaveBeenCalledWith(POSTS[0], 2);
    expect(lightboxRetentionList.items.value).toEqual([POSTS[0], POSTS[1], POSTS[2]]);
  });

  test("ignores a settled item while there is no sequence", async() => {
    const { lightboxRetentionList, settled, sequence } = setup(3);

    sequence.value = undefined;
    settled.emit(POSTS[0]);
    await flushMicrotasks();
    expect(lightboxRetentionList.items.value).toEqual([]);
  });

  describe("retain", () => {
    test("puts the newest items first, without repeats, up to its capacity", () => {
      const { lightboxRetentionList } = setup(3);

      lightboxRetentionList.retain([POSTS[0], POSTS[1]]);
      lightboxRetentionList.retain([POSTS[2], POSTS[0]]);
      expect(lightboxRetentionList.items.value).toEqual([POSTS[2], POSTS[0], POSTS[1]]);
      lightboxRetentionList.retain([POSTS[3]]);
      expect(lightboxRetentionList.items.value).toEqual([POSTS[3], POSTS[2], POSTS[0]]);
    });

    test("publishes nothing new when the items don't change", () => {
      const { lightboxRetentionList } = setup(2);

      lightboxRetentionList.retain([POSTS[0], POSTS[1]]);
      const currentItems = lightboxRetentionList.items.value;

      lightboxRetentionList.retain([POSTS[0]]);
      expect(lightboxRetentionList.items.value).toBe(currentItems);
    });
  });

  describe("dispose", () => {
    test("stops retaining settled items", async() => {
      const { lightboxRetentionList, settled } = setup(3);

      lightboxRetentionList.dispose();
      settled.emit(POSTS[0]);
      await flushMicrotasks();
      expect(lightboxRetentionList.items.value).toEqual([]);
    });
  });
});
