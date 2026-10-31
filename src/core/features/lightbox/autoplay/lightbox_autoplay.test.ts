import { describe, expect, test, vi } from "vitest";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPosts } from "@/testing/post";
import { createScope } from "@/core/utils/reactive/scope";

const INTERVAL = 1_000;
const POSTS = createPosts("1", "2");

function setup(): {
  lightboxAutoplay: LightboxAutoplay;
  dispose: () => void;
  scheduler: MemoryScheduler;
  goToNext: () => Promise<void>;
  isOpen: Signal<boolean>;
  currentItem: Signal<Post | undefined>;
  canCountDown: Signal<boolean>;
  video: Signal<HTMLVideoElement | undefined>;
} {
  const scheduler = new MemoryScheduler();
  const goToNext = vi.fn(() => Promise.resolve());
  const isOpen = new Signal(true);
  const currentItem = new Signal<Post | undefined>(POSTS[0]);
  const canCountDown = new Signal(true);
  const video = new Signal<HTMLVideoElement | undefined>(undefined);
  const { result: lightboxAutoplay, dispose } = createScope(() => new LightboxAutoplay(
    { interval: INTERVAL },
    { scheduler, lightboxNavigation: { isOpen, currentItem, goToNext }, canCountDown, video }
  ));
  return { lightboxAutoplay, dispose, scheduler, goToNext, isOpen, currentItem, canCountDown, video };
}

function createLoopingVideo(): HTMLVideoElement {
  const video = document.createElement("video");

  video.loop = true;
  return video;
}

describe("LightboxAutoplay", () => {
  test("starts stopped, without a countdown", () => {
    const { lightboxAutoplay } = setup();

    expect(lightboxAutoplay.isPlaying.value).toBe(false);
    expect(lightboxAutoplay.countdown.value).toBeUndefined();
  });

  test("shows the next item once the interval passes", () => {
    const { lightboxAutoplay, scheduler, goToNext } = setup();

    lightboxAutoplay.toggle();
    expect(lightboxAutoplay.countdown.value).toEqual({ mediaItem: POSTS[0], duration: INTERVAL });
    scheduler.advance(INTERVAL - 1);
    expect(goToNext).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("restarts the countdown when the item changes", () => {
    const { lightboxAutoplay, scheduler, goToNext, currentItem } = setup();

    lightboxAutoplay.toggle();
    scheduler.advance(INTERVAL / 2);
    currentItem.value = POSTS[1];
    scheduler.advance(INTERVAL / 2);
    expect(goToNext).not.toHaveBeenCalled();
    scheduler.advance(INTERVAL / 2);
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("holds the countdown while it can't count down", () => {
    const { lightboxAutoplay, scheduler, goToNext, canCountDown } = setup();

    lightboxAutoplay.toggle();
    canCountDown.value = false;
    expect(lightboxAutoplay.countdown.value).toBeUndefined();
    scheduler.advance(INTERVAL);
    expect(goToNext).not.toHaveBeenCalled();
  });

  test("holds the countdown without a current item", () => {
    const { lightboxAutoplay, currentItem } = setup();

    currentItem.value = undefined;
    lightboxAutoplay.toggle();
    expect(lightboxAutoplay.countdown.value).toBeUndefined();
  });

  test("shows the next item when the shown video ends instead of looping it", () => {
    const { lightboxAutoplay, goToNext, video } = setup();
    const shown = createLoopingVideo();

    video.value = shown;
    lightboxAutoplay.toggle();
    expect(shown.loop).toBe(false);
    shown.dispatchEvent(new Event("ended"));
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("loops the video again once stopped", () => {
    const { lightboxAutoplay, goToNext, video } = setup();
    const shown = createLoopingVideo();

    video.value = shown;
    lightboxAutoplay.toggle();
    lightboxAutoplay.toggle();
    expect(shown.loop).toBe(true);
    shown.dispatchEvent(new Event("ended"));
    expect(goToNext).not.toHaveBeenCalled();
  });

  test("stops when the lightbox closes", () => {
    const { lightboxAutoplay, isOpen } = setup();

    lightboxAutoplay.toggle();
    isOpen.value = false;
    expect(lightboxAutoplay.isPlaying.value).toBe(false);
  });

  test("cancels its countdown and releases the video when its scope is disposed", () => {
    const { lightboxAutoplay, dispose, scheduler, goToNext, video } = setup();
    const shown = createLoopingVideo();

    video.value = shown;
    lightboxAutoplay.toggle();
    dispose();
    scheduler.advance(INTERVAL);
    expect(goToNext).not.toHaveBeenCalled();
    expect(shown.loop).toBe(true);
  });

  describe("toggle", () => {
    test("starts and stops playing", () => {
      const { lightboxAutoplay } = setup();

      lightboxAutoplay.toggle();
      expect(lightboxAutoplay.isPlaying.value).toBe(true);
      lightboxAutoplay.toggle();
      expect(lightboxAutoplay.isPlaying.value).toBe(false);
      expect(lightboxAutoplay.countdown.value).toBeUndefined();
    });
  });
});
