import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";

const SETTLE_DELAY = 75;
const POSTS = createPosts("1", "2", "3");

function createMediaSequence(posts: readonly Post[]): MediaSequence<Post> {
  const getAt = (post: Post, offset: number): Promise<Post | undefined> => {
    const index = posts.indexOf(post);
    return Promise.resolve(index === -1 ? undefined : posts[index + offset]);
  };
  return {
    getNext: post => getAt(post, 1),
    getPrevious: post => getAt(post, -1),
    getNeighbors: () => Promise.resolve([]),
    positionOf: (post): { index: number; total: number } | undefined => {
      const index = posts.indexOf(post);
      return index === -1 ? undefined : { index, total: posts.length };
    }
  };
}

const SEQUENCE = createMediaSequence(POSTS);

function setup(): { lightboxNavigation: LightboxNavigation<Post>; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  const lightboxNavigation = new LightboxNavigation<Post>({ settleDelay: SETTLE_DELAY }, scheduler);
  return { lightboxNavigation, scheduler };
}

describe("LightboxNavigation", () => {
  test("starts closed with nothing shown", () => {
    const { lightboxNavigation } = setup();

    expect(lightboxNavigation.isOpen.value).toBe(false);
    expect(lightboxNavigation.currentItem.value).toBeUndefined();
    expect(lightboxNavigation.sequence.value).toBeUndefined();
  });

  describe("open", () => {
    test("shows the item in the sequence", () => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      expect(lightboxNavigation.isOpen.value).toBe(true);
      expect(lightboxNavigation.currentItem.value).toBe(POSTS[1]);
      expect(lightboxNavigation.sequence.value).toBe(SEQUENCE);
    });

    test("walks the sequence it was last opened with", async() => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[0]);
      lightboxNavigation.open(createMediaSequence([POSTS[0], POSTS[2]]), POSTS[0]);
      await lightboxNavigation.goToNext();
      expect(lightboxNavigation.currentItem.value).toBe(POSTS[2]);
    });
  });

  describe("close", () => {
    test("clears the item shown", () => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      lightboxNavigation.close();
      expect(lightboxNavigation.isOpen.value).toBe(false);
      expect(lightboxNavigation.currentItem.value).toBeUndefined();
    });

    test("announces the item it closed on, and nothing when already closed", () => {
      const { lightboxNavigation } = setup();
      const closedPosts: Post[] = [];

      lightboxNavigation.closed.on(post => closedPosts.push(post));
      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      lightboxNavigation.close();
      lightboxNavigation.close();
      expect(closedPosts).toEqual([POSTS[1]]);
    });
  });

  describe("dispose", () => {
    test("clears the item shown without announcing a close", () => {
      const { lightboxNavigation } = setup();
      const closedPosts: Post[] = [];

      lightboxNavigation.closed.on(post => closedPosts.push(post));
      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      lightboxNavigation.dispose();
      expect(lightboxNavigation.isOpen.value).toBe(false);
      expect(closedPosts).toEqual([]);
    });

    test("cancels a pending settle", () => {
      const { lightboxNavigation, scheduler } = setup();
      const settledPosts: Post[] = [];

      lightboxNavigation.settled.on(post => settledPosts.push(post));
      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      lightboxNavigation.dispose();
      scheduler.advance(SETTLE_DELAY);
      expect(settledPosts).toEqual([]);
    });
  });

  describe("goToNext", () => {
    test("shows the next item in the sequence", async() => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      await lightboxNavigation.goToNext();
      expect(lightboxNavigation.currentItem.value).toBe(POSTS[2]);
    });

    test("stays on the item when the sequence has nothing after it", async() => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[2]);
      await lightboxNavigation.goToNext();
      expect(lightboxNavigation.currentItem.value).toBe(POSTS[2]);
    });

    test("stays on an item the sequence doesn't hold", async() => {
      const { lightboxNavigation } = setup();
      const unlistedPost = createPost({ id: "9" });

      lightboxNavigation.open(SEQUENCE, unlistedPost);
      await lightboxNavigation.goToNext();
      expect(lightboxNavigation.currentItem.value).toBe(unlistedPost);
    });

    test("does nothing while closed", async() => {
      const { lightboxNavigation } = setup();

      await lightboxNavigation.goToNext();
      expect(lightboxNavigation.isOpen.value).toBe(false);
    });

    test("stays closed when closed while the sequence is searching", async() => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      const going = lightboxNavigation.goToNext();

      lightboxNavigation.close();
      await going;
      expect(lightboxNavigation.isOpen.value).toBe(false);
    });

    test("keeps an item opened while the sequence is searching", async() => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[0]);
      const going = lightboxNavigation.goToNext();

      lightboxNavigation.open(SEQUENCE, POSTS[2]);
      await going;
      expect(lightboxNavigation.currentItem.value).toBe(POSTS[2]);
    });
  });

  describe("goToPrevious", () => {
    test("shows the previous item in the sequence", async() => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      await lightboxNavigation.goToPrevious();
      expect(lightboxNavigation.currentItem.value).toBe(POSTS[0]);
    });

    test("stays on the item when the sequence has nothing before it", async() => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[0]);
      await lightboxNavigation.goToPrevious();
      expect(lightboxNavigation.currentItem.value).toBe(POSTS[0]);
    });
  });

  describe("position", () => {
    test("publishes where the item shown sits in the sequence", () => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      expect(lightboxNavigation.position.value).toEqual({ index: 1, total: 3 });
    });

    test("follows the item shown", async() => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      await lightboxNavigation.goToNext();
      expect(lightboxNavigation.position.value).toEqual({ index: 2, total: 3 });
    });

    test("reports nothing for an item the sequence doesn't hold", () => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, createPost({ id: "9" }));
      expect(lightboxNavigation.position.value).toBeUndefined();
    });

    test("reports nothing while closed", () => {
      const { lightboxNavigation } = setup();

      lightboxNavigation.open(SEQUENCE, POSTS[1]);
      lightboxNavigation.close();
      expect(lightboxNavigation.position.value).toBeUndefined();
    });
  });

  describe("settled", () => {
    test("announces the item shown once navigation pauses", async() => {
      const { lightboxNavigation, scheduler } = setup();
      const settledPosts: Post[] = [];

      lightboxNavigation.settled.on(post => settledPosts.push(post));
      lightboxNavigation.open(SEQUENCE, POSTS[0]);
      scheduler.advance(SETTLE_DELAY - 1);
      await lightboxNavigation.goToNext();
      scheduler.advance(SETTLE_DELAY - 1);
      expect(settledPosts).toEqual([]);
      scheduler.advance(1);
      expect(settledPosts).toEqual([POSTS[1]]);
    });

    test("announces nothing after closing", () => {
      const { lightboxNavigation, scheduler } = setup();
      const settledPosts: Post[] = [];

      lightboxNavigation.settled.on(post => settledPosts.push(post));
      lightboxNavigation.open(SEQUENCE, POSTS[0]);
      lightboxNavigation.close();
      scheduler.advance(SETTLE_DELAY);
      expect(settledPosts).toEqual([]);
    });
  });
});
