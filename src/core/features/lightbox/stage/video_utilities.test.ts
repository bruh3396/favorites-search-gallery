import { afterEach, describe, expect, test, vi } from "vitest";
import { flushMicrotasks } from "@/testing/async";
import { playVideo } from "@/core/features/lightbox/stage/video_utilities";

function createVideoPlaying(play: () => Promise<void>): HTMLVideoElement {
  const video = document.createElement("video");

  video.play = vi.fn(play);
  return video;
}

afterEach(() => {
  vi.restoreAllMocks();
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
