import { describe, expect, test } from "vitest";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay_visibility/lightbox_overlay_visibility";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { createScope } from "@/core/utils/reactive/scope";

const IDLE_DELAY = 750;
const LEAVE_DELAY = 1_000;

function setup(): { lightboxOverlayVisibility: LightboxOverlayVisibility; scheduler: MemoryScheduler; dispose: () => void } {
  const scheduler = new MemoryScheduler();
  const { result: lightboxOverlayVisibility, dispose } = createScope(() => new LightboxOverlayVisibility({ idleDelay: IDLE_DELAY, leaveDelay: LEAVE_DELAY }, scheduler));
  return { lightboxOverlayVisibility, scheduler, dispose };
}

describe("LightboxOverlayVisibility", () => {
  test("starts visible", () => {
    const { lightboxOverlayVisibility } = setup();

    expect(lightboxOverlayVisibility.visible.value).toBe(true);
  });

  describe("wake", () => {
    test("hides after the idle delay", () => {
      const { lightboxOverlayVisibility, scheduler } = setup();

      lightboxOverlayVisibility.wake();
      scheduler.advance(IDLE_DELAY - 1);
      expect(lightboxOverlayVisibility.visible.value).toBe(true);
      scheduler.advance(1);
      expect(lightboxOverlayVisibility.visible.value).toBe(false);
    });

    test("shows a hidden overlay", () => {
      const { lightboxOverlayVisibility, scheduler } = setup();

      lightboxOverlayVisibility.wake();
      scheduler.advance(IDLE_DELAY);
      lightboxOverlayVisibility.wake();
      expect(lightboxOverlayVisibility.visible.value).toBe(true);
    });

    test("restarts the idle delay", () => {
      const { lightboxOverlayVisibility, scheduler } = setup();

      lightboxOverlayVisibility.wake();
      scheduler.advance(IDLE_DELAY - 1);
      lightboxOverlayVisibility.wake();
      scheduler.advance(IDLE_DELAY - 1);
      expect(lightboxOverlayVisibility.visible.value).toBe(true);
    });
  });

  describe("leave", () => {
    test("hides after the leave delay", () => {
      const { lightboxOverlayVisibility, scheduler } = setup();

      lightboxOverlayVisibility.wake();
      lightboxOverlayVisibility.leave();
      scheduler.advance(LEAVE_DELAY - 1);
      expect(lightboxOverlayVisibility.visible.value).toBe(true);
      scheduler.advance(1);
      expect(lightboxOverlayVisibility.visible.value).toBe(false);
    });
  });

  describe("hold", () => {
    test("shows a hidden overlay", () => {
      const { lightboxOverlayVisibility, scheduler } = setup();

      lightboxOverlayVisibility.wake();
      scheduler.advance(IDLE_DELAY);
      lightboxOverlayVisibility.hold();
      expect(lightboxOverlayVisibility.visible.value).toBe(true);
    });

    test("keeps the overlay shown through wakes and leaves", () => {
      const { lightboxOverlayVisibility, scheduler } = setup();

      lightboxOverlayVisibility.wake();
      lightboxOverlayVisibility.hold();
      lightboxOverlayVisibility.wake();
      lightboxOverlayVisibility.leave();
      scheduler.advance(IDLE_DELAY);
      expect(lightboxOverlayVisibility.visible.value).toBe(true);
    });
  });

  describe("release", () => {
    test("hides after the idle delay", () => {
      const { lightboxOverlayVisibility, scheduler } = setup();

      lightboxOverlayVisibility.hold();
      lightboxOverlayVisibility.release();
      scheduler.advance(IDLE_DELAY - 1);
      expect(lightboxOverlayVisibility.visible.value).toBe(true);
      scheduler.advance(1);
      expect(lightboxOverlayVisibility.visible.value).toBe(false);
    });
  });

  test("cancels a pending hide when its scope is disposed", () => {
    const { lightboxOverlayVisibility, scheduler, dispose } = setup();

    lightboxOverlayVisibility.wake();
    dispose();
    scheduler.advance(IDLE_DELAY);
    expect(lightboxOverlayVisibility.visible.value).toBe(true);
  });
});
