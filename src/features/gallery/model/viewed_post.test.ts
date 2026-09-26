import { describe, expect, test } from "vitest";
import { GalleryViewedPost } from "@/features/gallery/model/viewed_post";

const THUMB = { id: "1" } as HTMLElement;

function createViewedPost(isInGallery: boolean, isVideoThumb: boolean): GalleryViewedPost {
  return new GalleryViewedPost({
    isInGallery: () => isInGallery,
    currentThumb: () => THUMB,
    isVideoThumb: () => isVideoThumb
  });
}

describe("GalleryViewedPost", () => {
  describe("get", () => {
    test("returns the current thumb while the gallery is open", () => {
      expect(createViewedPost(true, false).get()).toBe(THUMB);
    });

    test("returns null while the gallery is closed", () => {
      expect(createViewedPost(false, false).get()).toBeNull();
    });
  });

  describe("isVideo", () => {
    test("is true when the viewed post is a video", () => {
      expect(createViewedPost(true, true).isVideo()).toBe(true);
    });

    test("is false when the viewed post is not a video", () => {
      expect(createViewedPost(true, false).isVideo()).toBe(false);
    });

    test("is false while the gallery is closed, even if the current thumb is a video", () => {
      expect(createViewedPost(false, true).isVideo()).toBe(false);
    });
  });
});
