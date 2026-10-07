import { describe, expect, test } from "vitest";
import { MediaSequence } from "@/core/contracts/media_sequence";
import { Post } from "@/core/domain/post/post";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { createPosts } from "@/testing/post";

const POSTS = createPosts("1", "2");

function createMediaSequence(): MediaSequence<Post> {
  return {
    getNext: (item): Promise<Post | undefined> => Promise.resolve(POSTS[POSTS.indexOf(item) + 1]),
    getPrevious: (item): Promise<Post | undefined> => Promise.resolve(POSTS[POSTS.indexOf(item) - 1])
  };
}

describe("createLightbox", () => {
  test("opens, steps through, and closes the sequence's posts", async() => {
    const Lightbox = createLightbox({ mediaSequence: createMediaSequence() });

    Lightbox.intents.open(POSTS[0]);
    await Lightbox.intents.showNext();
    expect(Lightbox.current.value).toBe(POSTS[1]);
    await Lightbox.intents.showPrevious();
    expect(Lightbox.current.value).toBe(POSTS[0]);
    Lightbox.intents.close();
    expect(Lightbox.isOpen.value).toBe(false);
  });
});
