import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";

const SETTLE_DELAY = 75;
const POSTS = createPosts("1", "2", "3");

function createMediaSequence(posts: readonly Post[]): MediaSequence<Post> {
  const getAt = (item: Post, offset: number): Promise<Post | undefined> => {
    const index = posts.indexOf(item);
    return Promise.resolve(index === -1 ? undefined : posts[index + offset]);
  };
  return {
    getNext: item => getAt(item, 1),
    getPrevious: item => getAt(item, -1),
    getNeighbors: () => Promise.resolve([]),
    positionOf: (item): { index: number; total: number } | undefined => {
      const index = posts.indexOf(item);
      return index === -1 ? undefined : { index, total: posts.length };
    }
  };
}

const SEQUENCE = createMediaSequence(POSTS);

function setup(): { navigation: LightboxNavigation<Post>; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  const navigation = new LightboxNavigation<Post>({ settleDelay: SETTLE_DELAY }, scheduler);
  return { navigation, scheduler };
}

describe("LightboxNavigation", () => {
  test("starts closed with nothing shown", () => {
    const { navigation } = setup();

    expect(navigation.isOpen.value).toBe(false);
    expect(navigation.currentItem.value).toBeUndefined();
    expect(navigation.sequence.value).toBeUndefined();
  });

  describe("open", () => {
    test("shows the item in the sequence", () => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[1]);
      expect(navigation.isOpen.value).toBe(true);
      expect(navigation.currentItem.value).toBe(POSTS[1]);
      expect(navigation.sequence.value).toBe(SEQUENCE);
    });

    test("walks the sequence it was last opened with", async() => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[0]);
      navigation.open(createMediaSequence([POSTS[0], POSTS[2]]), POSTS[0]);
      await navigation.goToNext();
      expect(navigation.currentItem.value).toBe(POSTS[2]);
    });
  });

  describe("close", () => {
    test("clears the item shown", () => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[1]);
      navigation.close();
      expect(navigation.isOpen.value).toBe(false);
      expect(navigation.currentItem.value).toBeUndefined();
    });

    test("announces the item it closed on, and nothing when already closed", () => {
      const { navigation } = setup();
      const closed: Post[] = [];

      navigation.closed.on(item => closed.push(item));
      navigation.open(SEQUENCE, POSTS[1]);
      navigation.close();
      navigation.close();
      expect(closed).toEqual([POSTS[1]]);
    });
  });

  describe("dispose", () => {
    test("clears the item shown without announcing a close", () => {
      const { navigation } = setup();
      const closed: Post[] = [];

      navigation.closed.on(item => closed.push(item));
      navigation.open(SEQUENCE, POSTS[1]);
      navigation.dispose();
      expect(navigation.isOpen.value).toBe(false);
      expect(closed).toEqual([]);
    });

    test("cancels a pending settle", () => {
      const { navigation, scheduler } = setup();
      const settled: Post[] = [];

      navigation.settled.on(item => settled.push(item));
      navigation.open(SEQUENCE, POSTS[1]);
      navigation.dispose();
      scheduler.advance(SETTLE_DELAY);
      expect(settled).toEqual([]);
    });
  });

  describe("goToNext", () => {
    test("shows the next item in the sequence", async() => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[1]);
      await navigation.goToNext();
      expect(navigation.currentItem.value).toBe(POSTS[2]);
    });

    test("stays on the item when the sequence has nothing after it", async() => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[2]);
      await navigation.goToNext();
      expect(navigation.currentItem.value).toBe(POSTS[2]);
    });

    test("stays on an item the sequence doesn't hold", async() => {
      const { navigation } = setup();
      const unlisted = createPost({ id: "9" });

      navigation.open(SEQUENCE, unlisted);
      await navigation.goToNext();
      expect(navigation.currentItem.value).toBe(unlisted);
    });

    test("does nothing while closed", async() => {
      const { navigation } = setup();

      await navigation.goToNext();
      expect(navigation.isOpen.value).toBe(false);
    });

    test("stays closed when closed while the sequence is searching", async() => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[1]);
      const going = navigation.goToNext();

      navigation.close();
      await going;
      expect(navigation.isOpen.value).toBe(false);
    });

    test("keeps an item opened while the sequence is searching", async() => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[0]);
      const going = navigation.goToNext();

      navigation.open(SEQUENCE, POSTS[2]);
      await going;
      expect(navigation.currentItem.value).toBe(POSTS[2]);
    });
  });

  describe("goToPrevious", () => {
    test("shows the previous item in the sequence", async() => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[1]);
      await navigation.goToPrevious();
      expect(navigation.currentItem.value).toBe(POSTS[0]);
    });

    test("stays on the item when the sequence has nothing before it", async() => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[0]);
      await navigation.goToPrevious();
      expect(navigation.currentItem.value).toBe(POSTS[0]);
    });
  });

  describe("position", () => {
    test("publishes where the item shown sits in the sequence", () => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[1]);
      expect(navigation.position.value).toEqual({ index: 1, total: 3 });
    });

    test("follows the item shown", async() => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[1]);
      await navigation.goToNext();
      expect(navigation.position.value).toEqual({ index: 2, total: 3 });
    });

    test("reports nothing for an item the sequence doesn't hold", () => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, createPost({ id: "9" }));
      expect(navigation.position.value).toBeUndefined();
    });

    test("reports nothing while closed", () => {
      const { navigation } = setup();

      navigation.open(SEQUENCE, POSTS[1]);
      navigation.close();
      expect(navigation.position.value).toBeUndefined();
    });
  });

  describe("settled", () => {
    test("announces the item shown once navigation pauses", async() => {
      const { navigation, scheduler } = setup();
      const settled: Post[] = [];

      navigation.settled.on(item => settled.push(item));
      navigation.open(SEQUENCE, POSTS[0]);
      scheduler.advance(SETTLE_DELAY - 1);
      await navigation.goToNext();
      scheduler.advance(SETTLE_DELAY - 1);
      expect(settled).toEqual([]);
      scheduler.advance(1);
      expect(settled).toEqual([POSTS[1]]);
    });

    test("announces nothing after closing", () => {
      const { navigation, scheduler } = setup();
      const settled: Post[] = [];

      navigation.settled.on(item => settled.push(item));
      navigation.open(SEQUENCE, POSTS[0]);
      navigation.close();
      scheduler.advance(SETTLE_DELAY);
      expect(settled).toEqual([]);
    });
  });
});
