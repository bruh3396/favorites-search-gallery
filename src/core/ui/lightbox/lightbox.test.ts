import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { MediaSequence } from "@/core/contracts/media_sequence";
import { Post } from "@/core/domain/post/post";

const POSTS = createPosts("1", "2", "3");

function createMediaSequence(posts: readonly Post[]): MediaSequence<Post> {
  const getAt = (item: Post, offset: number): Promise<Post | undefined> => {
    const index = posts.indexOf(item);
    return Promise.resolve(index === -1 ? undefined : posts[index + offset]);
  };
  return {
    getNext: item => getAt(item, 1),
    getPrevious: item => getAt(item, -1)
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
