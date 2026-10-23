import { describe, expect, test, vi } from "vitest";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPosts } from "@/testing/post";
import { createScope } from "@/core/utils/reactive/scope";

const INTERVAL = 1_000;
const POSTS = createPosts("1", "2");

function setup(): {
  autoplay: LightboxAutoplay;
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
  const { result: autoplay, dispose } = createScope(() => new LightboxAutoplay(
    { interval: INTERVAL },
    { scheduler, navigation: { isOpen, currentItem, goToNext }, canCountDown, video }
  ));
  return { autoplay, dispose, scheduler, goToNext, isOpen, currentItem, canCountDown, video };
}

function createLoopingVideo(): HTMLVideoElement {
  const video = document.createElement("video");

  video.loop = true;
  return video;
}

describe("LightboxAutoplay", () => {
  test("starts stopped, without a countdown", () => {
    const { autoplay } = setup();

    expect(autoplay.isPlaying.value).toBe(false);
    expect(autoplay.countdown.value).toBeUndefined();
  });

  test("shows the next item once the interval passes", () => {
    const { autoplay, scheduler, goToNext } = setup();

    autoplay.toggle();
    expect(autoplay.countdown.value).toEqual({ item: POSTS[0], duration: INTERVAL });
    scheduler.advance(INTERVAL - 1);
    expect(goToNext).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("restarts the countdown when the item changes", () => {
    const { autoplay, scheduler, goToNext, currentItem } = setup();

    autoplay.toggle();
    scheduler.advance(INTERVAL / 2);
    currentItem.value = POSTS[1];
    scheduler.advance(INTERVAL / 2);
    expect(goToNext).not.toHaveBeenCalled();
    scheduler.advance(INTERVAL / 2);
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("holds the countdown while it can't count down", () => {
    const { autoplay, scheduler, goToNext, canCountDown } = setup();

    autoplay.toggle();
    canCountDown.value = false;
    expect(autoplay.countdown.value).toBeUndefined();
    scheduler.advance(INTERVAL);
    expect(goToNext).not.toHaveBeenCalled();
  });

  test("holds the countdown without a current item", () => {
    const { autoplay, currentItem } = setup();

    currentItem.value = undefined;
    autoplay.toggle();
    expect(autoplay.countdown.value).toBeUndefined();
  });

  test("shows the next item when the shown video ends instead of looping it", () => {
    const { autoplay, goToNext, video } = setup();
    const shown = createLoopingVideo();

    video.value = shown;
    autoplay.toggle();
    expect(shown.loop).toBe(false);
    shown.dispatchEvent(new Event("ended"));
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("loops the video again once stopped", () => {
    const { autoplay, goToNext, video } = setup();
    const shown = createLoopingVideo();

    video.value = shown;
    autoplay.toggle();
    autoplay.toggle();
    expect(shown.loop).toBe(true);
    shown.dispatchEvent(new Event("ended"));
    expect(goToNext).not.toHaveBeenCalled();
  });

  test("stops when the lightbox closes", () => {
    const { autoplay, isOpen } = setup();

    autoplay.toggle();
    isOpen.value = false;
    expect(autoplay.isPlaying.value).toBe(false);
  });

  test("cancels its countdown and releases the video when its scope is disposed", () => {
    const { autoplay, dispose, scheduler, goToNext, video } = setup();
    const shown = createLoopingVideo();

    video.value = shown;
    autoplay.toggle();
    dispose();
    scheduler.advance(INTERVAL);
    expect(goToNext).not.toHaveBeenCalled();
    expect(shown.loop).toBe(true);
  });

  describe("toggle", () => {
    test("starts and stops playing", () => {
      const { autoplay } = setup();

      autoplay.toggle();
      expect(autoplay.isPlaying.value).toBe(true);
      autoplay.toggle();
      expect(autoplay.isPlaying.value).toBe(false);
      expect(autoplay.countdown.value).toBeUndefined();
    });
  });
});
