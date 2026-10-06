import { describe, expect, test } from "vitest";
import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/features/lightbox/types/media_sequence";
import { createPosts } from "@/testing/post";
import { startLightbox } from "@/core/features/lightbox/lightbox";

const POSTS = createPosts("1", "2");

function createMediaSequence(): MediaSequence {
  return {
    findNext: (item): Promise<MediaItem | undefined> => Promise.resolve(POSTS[POSTS.indexOf(item) + 1]),
    findPrevious: (item): Promise<MediaItem | undefined> => Promise.resolve(POSTS[POSTS.indexOf(item) - 1])
  };
}

describe("startLightbox", () => {
  test("opens, steps through, and closes the sequence's posts", async() => {
    const Lightbox = startLightbox({ mediaSequence: createMediaSequence() });

    Lightbox.intents.open(POSTS[0]);
    await Lightbox.intents.showNext();
    expect(Lightbox.current.value).toBe(POSTS[1]);
    await Lightbox.intents.showPrevious();
    expect(Lightbox.current.value).toBe(POSTS[0]);
    Lightbox.intents.close();
    expect(Lightbox.isOpen.value).toBe(false);
  });
});
