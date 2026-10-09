import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { MediaSequence, SequencePosition } from "@/core/contracts/media_sequence";
import { Post } from "@/core/domain/post/post";
import { doNothing } from "@/core/utils/function/function";
import { flushMicrotasks } from "@/testing/async";

const POSTS = createPosts("1", "2", "3");

function findPosition(posts: readonly Post[], item: Post): SequencePosition | undefined {
  const index = posts.indexOf(item);
  return index === -1 ? undefined : { index, total: posts.length };
}

function createMediaSequence(posts: readonly Post[]): MediaSequence<Post> {
  const getAt = (item: Post, offset: number): Promise<Post | undefined> => {
    const index = posts.indexOf(item);
    return Promise.resolve(index === -1 ? undefined : posts[index + offset]);
  };
  return {
    getNext: item => getAt(item, 1),
    getPrevious: item => getAt(item, -1),
    positionOf: item => findPosition(posts, item)
  };
}

function createWrappingSequence(posts: readonly Post[]): MediaSequence<Post> {
  const getAt = (item: Post, offset: number): Promise<Post | undefined> => Promise.resolve(posts[(posts.indexOf(item) + offset + posts.length) % posts.length]);
  return {
    getNext: item => getAt(item, 1),
    getPrevious: item => getAt(item, -1),
    positionOf: item => findPosition(posts, item)
  };
}

const SEQUENCE = createMediaSequence(POSTS);

describe("Lightbox", () => {
  test("starts closed with nothing shown", () => {
    const lightbox = new Lightbox<Post>();

    expect(lightbox.isOpen.value).toBe(false);
    expect(lightbox.current.value).toBeUndefined();
  });

  describe("open", () => {
    test("shows the post", () => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      expect(lightbox.isOpen.value).toBe(true);
      expect(lightbox.current.value).toBe(POSTS[1]);
    });

    test("walks the sequence it was last opened with", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[0], SEQUENCE);
      lightbox.open(POSTS[0], createMediaSequence([POSTS[0], POSTS[2]]));
      await lightbox.showNext();
      expect(lightbox.current.value).toBe(POSTS[2]);
    });
  });

  describe("close", () => {
    test("closes and clears the post shown", () => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      lightbox.close();
      expect(lightbox.isOpen.value).toBe(false);
      expect(lightbox.current.value).toBeUndefined();
    });
  });

  describe("showNext", () => {
    test("shows the next post in the sequence", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      await lightbox.showNext();
      expect(lightbox.current.value).toBe(POSTS[2]);
    });

    test("stays on the post when the sequence has nothing after it", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[2], SEQUENCE);
      await lightbox.showNext();
      expect(lightbox.current.value).toBe(POSTS[2]);
    });

    test("stays on a post the sequence doesn't hold", async() => {
      const lightbox = new Lightbox<Post>();
      const unlisted = createPost({ id: "9" });

      lightbox.open(unlisted, SEQUENCE);
      await lightbox.showNext();
      expect(lightbox.current.value).toBe(unlisted);
    });

    test("does nothing while closed", async() => {
      const lightbox = new Lightbox<Post>();

      await lightbox.showNext();
      expect(lightbox.isOpen.value).toBe(false);
    });

    test("stays closed when closed while the sequence is searching", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      const showing = lightbox.showNext();

      lightbox.close();
      await showing;
      expect(lightbox.isOpen.value).toBe(false);
    });

    test("keeps a post opened while the sequence is searching", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[0], SEQUENCE);
      const showing = lightbox.showNext();

      lightbox.open(POSTS[2], SEQUENCE);
      await showing;
      expect(lightbox.current.value).toBe(POSTS[2]);
    });

    test("ignores a neighbor from a sequence replaced while searching", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[0], SEQUENCE);
      const showing = lightbox.showNext();

      lightbox.open(POSTS[0], createMediaSequence([POSTS[0]]));
      await showing;
      expect(lightbox.current.value).toBe(POSTS[0]);
    });
  });

  describe("neighbors", () => {
    test("publishes the posts on either side of the post opened", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      await flushMicrotasks();
      expect(lightbox.neighbors.value).toEqual([POSTS[0], POSTS[2]]);
    });

    test("leaves out a side the sequence has nothing on", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[0], SEQUENCE);
      await flushMicrotasks();
      expect(lightbox.neighbors.value).toEqual([POSTS[1]]);
    });

    test("lists a post on both sides once", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[0], createWrappingSequence([POSTS[0], POSTS[1]]));
      await flushMicrotasks();
      expect(lightbox.neighbors.value).toEqual([POSTS[1]]);
    });

    test("leaves out the post shown", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[0], createWrappingSequence([POSTS[0]]));
      await flushMicrotasks();
      expect(lightbox.neighbors.value).toEqual([]);
    });

    test("follows the post shown", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      await lightbox.showNext();
      expect(lightbox.neighbors.value).toEqual([POSTS[1]]);
    });

    test("clears them on close", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      await flushMicrotasks();
      lightbox.close();
      expect(lightbox.neighbors.value).toEqual([]);
    });

    test("ignores neighbors found for a post left since", async() => {
      const lightbox = new Lightbox<Post>();
      let finishSearching = doNothing;
      const slow: MediaSequence<Post> = {
        getNext: () => new Promise(resolve => {
          finishSearching = () => resolve(POSTS[1]);
        }),
        getPrevious: () => Promise.resolve(undefined),
        positionOf: () => undefined
      };

      lightbox.open(POSTS[0], slow);
      lightbox.open(POSTS[2], SEQUENCE);
      await flushMicrotasks();
      finishSearching();
      await flushMicrotasks();
      expect(lightbox.neighbors.value).toEqual([POSTS[1]]);
    });
  });

  describe("position", () => {
    test("publishes where the post shown sits in the sequence", () => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      expect(lightbox.position.value).toEqual({ index: 1, total: 3 });
    });

    test("follows the post shown", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      await lightbox.showNext();
      expect(lightbox.position.value).toEqual({ index: 2, total: 3 });
    });

    test("is unknown for a post the sequence doesn't hold", () => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(createPost({ id: "9" }), SEQUENCE);
      expect(lightbox.position.value).toBeUndefined();
    });

    test("is unknown while closed", () => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      lightbox.close();
      expect(lightbox.position.value).toBeUndefined();
    });
  });

  describe("showPrevious", () => {
    test("shows the previous post in the sequence", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[1], SEQUENCE);
      await lightbox.showPrevious();
      expect(lightbox.current.value).toBe(POSTS[0]);
    });

    test("stays on the post when the sequence has nothing before it", async() => {
      const lightbox = new Lightbox<Post>();

      lightbox.open(POSTS[0], SEQUENCE);
      await lightbox.showPrevious();
      expect(lightbox.current.value).toBe(POSTS[0]);
    });
  });
});
