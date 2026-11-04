import { Signal, computed } from "@/core/utils/reactive/signal";
import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { ListSequence } from "@/core/features/lightbox/navigation/list_sequence";
import { Post } from "@/core/domain/post/post";

const POSTS = createPosts("1", "2", "3");

describe("ListSequence", () => {
  test("steps to the neighbors in the list", async() => {
    const listSequence = new ListSequence({ wraps: false }, new Signal<readonly Post[]>(POSTS));

    expect([await listSequence.getNext(POSTS[1]), await listSequence.getPrevious(POSTS[1])]).toEqual([POSTS[2], POSTS[0]]);
  });

  test("returns nothing past either end when it doesn't wrap", async() => {
    const listSequence = new ListSequence({ wraps: false }, new Signal<readonly Post[]>(POSTS));

    expect([await listSequence.getNext(POSTS[2]), await listSequence.getPrevious(POSTS[0])]).toEqual([undefined, undefined]);
  });

  test("wraps around either end when it wraps", async() => {
    const listSequence = new ListSequence({ wraps: true }, new Signal<readonly Post[]>(POSTS));

    expect([await listSequence.getNext(POSTS[2]), await listSequence.getPrevious(POSTS[0])]).toEqual([POSTS[0], POSTS[2]]);
  });

  test("returns nothing for an item the list doesn't hold", async() => {
    const listSequence = new ListSequence({ wraps: true }, new Signal<readonly Post[]>(POSTS));

    expect(await listSequence.getNext(createPost({ id: "9" }))).toBeUndefined();
  });

  describe("getNeighbors", () => {
    test("returns the nearest items on either side, nearest first, within the list when it doesn't wrap", async() => {
      const listSequence = new ListSequence({ wraps: false }, new Signal<readonly Post[]>(POSTS));

      expect(await listSequence.getNeighbors(POSTS[0], 2)).toEqual([POSTS[1], POSTS[2]]);
    });

    test("returns the nearest items around either end when it wraps", async() => {
      const listSequence = new ListSequence({ wraps: true }, new Signal<readonly Post[]>(POSTS));

      expect(await listSequence.getNeighbors(POSTS[0], 2)).toEqual([POSTS[2], POSTS[1]]);
    });
  });

  describe("positionOf", () => {
    test("returns the item's index and the list's length", () => {
      const listSequence = new ListSequence({ wraps: false }, new Signal<readonly Post[]>(POSTS));

      expect(listSequence.positionOf(POSTS[2])).toEqual({ index: 2, total: 3 });
    });

    test("returns nothing for an item the list doesn't hold", () => {
      const listSequence = new ListSequence({ wraps: false }, new Signal<readonly Post[]>(POSTS));

      expect(listSequence.positionOf(createPost({ id: "9" }))).toBeUndefined();
    });

    test("follows the list as it changes", () => {
      const list = new Signal<readonly Post[]>(POSTS);
      const listSequence = new ListSequence({ wraps: false }, list);
      const position = computed(() => listSequence.positionOf(POSTS[0]));

      expect(position.value).toEqual({ index: 0, total: 3 });
      list.value = [POSTS[1], POSTS[0]];
      expect(position.value).toEqual({ index: 1, total: 2 });
    });
  });

  test("steps through the list as it is at each step", async() => {
    const list = new Signal<readonly Post[]>(POSTS);
    const listSequence = new ListSequence({ wraps: false }, list);

    list.value = [POSTS[1], POSTS[0]];
    expect(await listSequence.getNext(POSTS[1])).toBe(POSTS[0]);
  });
});
