import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { LightboxNavigationFlow } from "@/core/features/lightbox/flows/navigation";
import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/features/lightbox/types/media_sequence";

const POSTS = createPosts("1", "2", "3");

function findAt(item: MediaItem, offset: number): Promise<MediaItem | undefined> {
  const index = POSTS.indexOf(item);
  return Promise.resolve(index === -1 ? undefined : POSTS[index + offset]);
}

function createMediaSequence(): MediaSequence {
  return {
    findNext: item => findAt(item, 1),
    findPrevious: item => findAt(item, -1)
  };
}

function setup(): LightboxNavigationFlow {
  return new LightboxNavigationFlow({ mediaSequence: createMediaSequence() });
}

describe("LightboxNavigationFlow", () => {
  test("starts closed with nothing shown", () => {
    const navigation = setup();

    expect(navigation.isOpen.value).toBe(false);
    expect(navigation.current.value).toBeUndefined();
  });

  describe("open", () => {
    test("shows the post", () => {
      const navigation = setup();

      navigation.open(POSTS[1]);
      expect(navigation.isOpen.value).toBe(true);
      expect(navigation.current.value).toBe(POSTS[1]);
    });
  });

  describe("close", () => {
    test("closes and clears the post shown", () => {
      const navigation = setup();

      navigation.open(POSTS[1]);
      navigation.close();
      expect(navigation.isOpen.value).toBe(false);
      expect(navigation.current.value).toBeUndefined();
    });
  });

  describe("showNext", () => {
    test("shows the next post in the sequence", async() => {
      const navigation = setup();

      navigation.open(POSTS[1]);
      await navigation.showNext();
      expect(navigation.current.value).toBe(POSTS[2]);
    });

    test("stays on the post when the sequence has nothing after it", async() => {
      const navigation = setup();

      navigation.open(POSTS[2]);
      await navigation.showNext();
      expect(navigation.current.value).toBe(POSTS[2]);
    });

    test("stays on a post the sequence doesn't hold", async() => {
      const navigation = setup();
      const unlisted = createPost({ id: "9" });

      navigation.open(unlisted);
      await navigation.showNext();
      expect(navigation.current.value).toBe(unlisted);
    });

    test("does nothing while closed", async() => {
      const navigation = setup();

      await navigation.showNext();
      expect(navigation.isOpen.value).toBe(false);
    });

    test("stays closed when closed while the sequence is searching", async() => {
      const navigation = setup();

      navigation.open(POSTS[1]);
      const showing = navigation.showNext();

      navigation.close();
      await showing;
      expect(navigation.isOpen.value).toBe(false);
    });

    test("keeps a post opened while the sequence is searching", async() => {
      const navigation = setup();

      navigation.open(POSTS[0]);
      const showing = navigation.showNext();

      navigation.open(POSTS[2]);
      await showing;
      expect(navigation.current.value).toBe(POSTS[2]);
    });
  });

  describe("showPrevious", () => {
    test("shows the previous post in the sequence", async() => {
      const navigation = setup();

      navigation.open(POSTS[1]);
      await navigation.showPrevious();
      expect(navigation.current.value).toBe(POSTS[0]);
    });

    test("stays on the post when the sequence has nothing before it", async() => {
      const navigation = setup();

      navigation.open(POSTS[0]);
      await navigation.showPrevious();
      expect(navigation.current.value).toBe(POSTS[0]);
    });
  });
});
