import { describe, expect, test, vi } from "vitest";
import { LightboxVideoPool } from "@/core/features/lightbox/stage/lightbox_video_pool";

function createFakeVideo(): HTMLVideoElement {
  const video = {
    src: "",
    pause: vi.fn(),
    load: vi.fn(),
    removeAttribute: vi.fn((name: string) => {
      if (name === "src") {
        video.src = "";
      }
    })
  };
  return video as unknown as HTMLVideoElement;
}

describe("LightboxVideoPool", () => {
  test("creates its videos up front", () => {
    const createVideo = vi.fn(createFakeVideo);

    new LightboxVideoPool({ capacity: 2 }, createVideo);
    expect(createVideo).toHaveBeenCalledTimes(2);
  });

  describe("acquire", () => {
    test("hands out a free video pointed at the url", () => {
      const pool = new LightboxVideoPool({ capacity: 1 }, createFakeVideo);

      expect(pool.acquire("a.mp4").src).toBe("a.mp4");
    });

    test("throws once every video is out", () => {
      const pool = new LightboxVideoPool({ capacity: 1 }, createFakeVideo);

      pool.acquire("a.mp4");
      expect(() => pool.acquire("b.mp4")).toThrow("No free video element");
    });
  });

  describe("release", () => {
    test("stops the video, drops its source, and makes it free again", () => {
      const pool = new LightboxVideoPool({ capacity: 1 }, createFakeVideo);
      const video = pool.acquire("a.mp4");

      pool.release(video);
      expect(video.pause).toHaveBeenCalled();
      expect(video.src).toBe("");
      expect(video.load).toHaveBeenCalled();
      expect(pool.acquire("b.mp4")).toBe(video);
    });
  });
});
