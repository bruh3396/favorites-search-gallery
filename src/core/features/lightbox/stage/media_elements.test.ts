import { afterEach, describe, expect, test, vi } from "vitest";
import { createLightboxImage, createLightboxVideo, playVideo } from "@/core/features/lightbox/stage/media_elements";
import { flushMicrotasks } from "@/testing/async";

const BITMAP = { width: 4, height: 3 } as ImageBitmap;

function createVideoPlaying(play: () => Promise<void>): HTMLVideoElement {
  const video = document.createElement("video");

  video.play = vi.fn(play);
  return video;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createLightboxImage", () => {
  test("draws the bitmap onto a canvas of its size", () => {
    const context = { drawImage: vi.fn() };

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const canvas = createLightboxImage(document, BITMAP);

    expect([canvas.width, canvas.height]).toEqual([4, 3]);
    expect(context.drawImage).toHaveBeenCalledWith(BITMAP, 0, 0);
  });

  test("returns a sized canvas when it has no 2D context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    expect(createLightboxImage(document, BITMAP).width).toBe(4);
  });
});

describe("createLightboxVideo", () => {
  test("creates a looping, preloading video with controls but no fullscreen button", () => {
    const video = createLightboxVideo(document);

    expect([video.controls, video.loop, video.preload]).toEqual([true, true, "auto"]);
    expect(video.getAttribute("controlsList")).toBe("nofullscreen");
  });
});

describe("playVideo", () => {
  test("plays the video", () => {
    const video = createVideoPlaying(() => Promise.resolve());

    playVideo(video);
    expect(video.play).toHaveBeenCalledOnce();
  });

  test("ignores a play interrupted by a pause or a new source", async() => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => { });

    playVideo(createVideoPlaying(() => Promise.reject(new DOMException("interrupted", "AbortError"))));
    await flushMicrotasks();
    expect(logged).not.toHaveBeenCalled();
  });

  test("logs any other failure", async() => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => { });
    const error = new DOMException("blocked", "NotAllowedError");

    playVideo(createVideoPlaying(() => Promise.reject(error)));
    await flushMicrotasks();
    expect(logged).toHaveBeenCalledWith(error);
  });
});
