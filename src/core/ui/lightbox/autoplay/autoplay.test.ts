import { describe, expect, onTestFinished, test, vi } from "vitest";
import { LightboxAutoplay } from "@/core/ui/lightbox/autoplay/autoplay";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";

const IMAGE: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const GIF: MediaItem = { id: "2", media: { kind: "gif", locator: "images/2.gif" } };
const VIDEO: MediaItem = { id: "3", media: { kind: "video", locator: "videos/3.mp4" } };

interface Setup {
  autoplay: LightboxAutoplay;
  current: Signal<MediaItem | undefined>;
  scheduler: MemoryScheduler;
  showNext: ReturnType<typeof vi.fn<() => void>>;
}

function setup(item: MediaItem | undefined = IMAGE): Setup {
  const current = new Signal<MediaItem | undefined>(item);
  const scheduler = new MemoryScheduler();
  const showNext = vi.fn<() => void>();
  const autoplay = new LightboxAutoplay({ interval: 3_000 }, { current, showNext, scheduler });

  onTestFinished(() => autoplay.dispose());
  return { autoplay, current, scheduler, showNext };
}

describe("LightboxAutoplay", () => {
  test("starts paused, with no countdown", () => {
    const { autoplay, scheduler, showNext } = setup();

    scheduler.advance(10_000);
    expect([autoplay.isPlaying.value, autoplay.countdown.value, showNext.mock.calls.length]).toEqual([false, undefined, 0]);
  });

  describe("toggle", () => {
    test("steps to the next item once the interval passes, for images and GIFs", () => {
      for (const item of [IMAGE, GIF]) {
        const { autoplay, scheduler, showNext } = setup(item);

        autoplay.toggle();
        scheduler.advance(2_999);
        expect(showNext).not.toHaveBeenCalled();
        scheduler.advance(1);
        expect(showNext).toHaveBeenCalledOnce();
      }
    });

    test("pauses a running countdown when toggled again", () => {
      const { autoplay, scheduler, showNext } = setup();

      autoplay.toggle();
      autoplay.toggle();
      scheduler.advance(3_000);
      expect([autoplay.isPlaying.value, autoplay.countdown.value, showNext.mock.calls.length]).toEqual([false, undefined, 0]);
    });
  });

  test("restarts its countdown with a fresh one when the shown item changes", () => {
    const { autoplay, current, scheduler, showNext } = setup();

    autoplay.toggle();
    const first = autoplay.countdown.value;

    scheduler.advance(2_000);
    current.value = GIF;
    scheduler.advance(2_000);
    expect([showNext.mock.calls.length, autoplay.countdown.value !== first, autoplay.countdown.value]).toEqual([0, true, { duration: 3_000 }]);
  });

  test("waits on a video instead of counting down", () => {
    const { autoplay, scheduler, showNext } = setup(VIDEO);

    autoplay.toggle();
    scheduler.advance(10_000);
    expect([autoplay.countdown.value, showNext.mock.calls.length]).toEqual([undefined, 0]);
  });

  describe("finishVideo", () => {
    test("steps on from a video only while playing", () => {
      const { autoplay, showNext } = setup(VIDEO);

      autoplay.finishVideo();
      autoplay.toggle();
      autoplay.finishVideo();
      expect(showNext).toHaveBeenCalledOnce();
    });

    test("ignores a video ending under an image", () => {
      const { autoplay, showNext } = setup();

      autoplay.toggle();
      autoplay.finishVideo();
      expect(showNext).not.toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    test("pauses and cancels the countdown", () => {
      const { autoplay, scheduler, showNext } = setup();

      autoplay.toggle();
      autoplay.stop();
      scheduler.advance(3_000);
      expect([autoplay.isPlaying.value, showNext.mock.calls.length]).toEqual([false, 0]);
    });
  });

  describe("dispose", () => {
    test("cancels the countdown and stops following the shown item", () => {
      const { autoplay, current, scheduler, showNext } = setup();

      autoplay.toggle();
      autoplay.dispose();
      current.value = GIF;
      scheduler.advance(10_000);
      expect(showNext).not.toHaveBeenCalled();
    });
  });
});
