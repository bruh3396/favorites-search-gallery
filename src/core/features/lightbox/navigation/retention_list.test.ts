import { describe, expect, test, vi } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";
import { LightboxRetentionList } from "@/core/features/lightbox/navigation/retention_list";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPosts } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";

const POSTS = createPosts("1", "2", "3", "4");

function setup(capacity: number): {
  list: LightboxRetentionList<Post>;
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
  return { list: new LightboxRetentionList<Post>({ capacity }, { settled, sequence }), settled, sequence, getNeighbors };
}

describe("LightboxRetentionList", () => {
  test("starts empty", () => {
    expect(setup(2).list.items.value).toEqual([]);
  });

  test("retains a settled item and as many of its neighbours as fit", async() => {
    const { list, settled, getNeighbors } = setup(3);

    settled.emit(POSTS[0]);
    await flushMicrotasks();
    expect(getNeighbors).toHaveBeenCalledWith(POSTS[0], 2);
    expect(list.items.value).toEqual([POSTS[0], POSTS[1], POSTS[2]]);
  });

  test("ignores a settled item while there is no sequence", async() => {
    const { list, settled, sequence } = setup(3);

    sequence.value = undefined;
    settled.emit(POSTS[0]);
    await flushMicrotasks();
    expect(list.items.value).toEqual([]);
  });

  describe("retain", () => {
    test("puts the newest items first, without repeats, up to its capacity", () => {
      const { list } = setup(3);

      list.retain([POSTS[0], POSTS[1]]);
      list.retain([POSTS[2], POSTS[0]]);
      expect(list.items.value).toEqual([POSTS[2], POSTS[0], POSTS[1]]);
      list.retain([POSTS[3]]);
      expect(list.items.value).toEqual([POSTS[3], POSTS[2], POSTS[0]]);
    });

    test("publishes nothing new when the items don't change", () => {
      const { list } = setup(2);

      list.retain([POSTS[0], POSTS[1]]);
      const published = list.items.value;

      list.retain([POSTS[0]]);
      expect(list.items.value).toBe(published);
    });
  });

  describe("dispose", () => {
    test("stops retaining settled items", async() => {
      const { list, settled } = setup(3);

      list.dispose();
      settled.emit(POSTS[0]);
      await flushMicrotasks();
      expect(list.items.value).toEqual([]);
    });
  });
});
