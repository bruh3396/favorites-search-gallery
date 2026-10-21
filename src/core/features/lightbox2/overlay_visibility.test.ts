import { describe, expect, test } from "vitest";
import { LightboxOverlayVisibility } from "@/core/features/lightbox2/overlay_visibility";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

const IDLE_DELAY = 2_000;
const LEAVE_DELAY = 1_000;

function setup(): { visibility: LightboxOverlayVisibility; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  const visibility = new LightboxOverlayVisibility({ idleDelay: IDLE_DELAY, leaveDelay: LEAVE_DELAY }, scheduler);
  return { visibility, scheduler };
}

describe("LightboxOverlayVisibility", () => {
  test("starts visible", () => {
    const { visibility } = setup();

    expect(visibility.visible.value).toBe(true);
  });

  describe("wake", () => {
    test("hides after the idle delay", () => {
      const { visibility, scheduler } = setup();

      visibility.wake();
      scheduler.advance(IDLE_DELAY - 1);
      expect(visibility.visible.value).toBe(true);
      scheduler.advance(1);
      expect(visibility.visible.value).toBe(false);
    });

    test("shows a hidden overlay", () => {
      const { visibility, scheduler } = setup();

      visibility.wake();
      scheduler.advance(IDLE_DELAY);
      visibility.wake();
      expect(visibility.visible.value).toBe(true);
    });

    test("restarts the idle delay", () => {
      const { visibility, scheduler } = setup();

      visibility.wake();
      scheduler.advance(IDLE_DELAY - 1);
      visibility.wake();
      scheduler.advance(IDLE_DELAY - 1);
      expect(visibility.visible.value).toBe(true);
    });
  });

  describe("leave", () => {
    test("hides after the leave delay", () => {
      const { visibility, scheduler } = setup();

      visibility.wake();
      visibility.leave();
      scheduler.advance(LEAVE_DELAY - 1);
      expect(visibility.visible.value).toBe(true);
      scheduler.advance(1);
      expect(visibility.visible.value).toBe(false);
    });
  });

  describe("hold", () => {
    test("shows a hidden overlay", () => {
      const { visibility, scheduler } = setup();

      visibility.wake();
      scheduler.advance(IDLE_DELAY);
      visibility.hold();
      expect(visibility.visible.value).toBe(true);
    });

    test("keeps the overlay shown through wakes and leaves", () => {
      const { visibility, scheduler } = setup();

      visibility.wake();
      visibility.hold();
      visibility.wake();
      visibility.leave();
      scheduler.advance(IDLE_DELAY);
      expect(visibility.visible.value).toBe(true);
    });
  });

  describe("release", () => {
    test("hides after the idle delay", () => {
      const { visibility, scheduler } = setup();

      visibility.hold();
      visibility.release();
      scheduler.advance(IDLE_DELAY - 1);
      expect(visibility.visible.value).toBe(true);
      scheduler.advance(1);
      expect(visibility.visible.value).toBe(false);
    });
  });

  describe("dispose", () => {
    test("cancels a pending hide", () => {
      const { visibility, scheduler } = setup();

      visibility.wake();
      visibility.dispose();
      scheduler.advance(IDLE_DELAY);
      expect(visibility.visible.value).toBe(true);
    });
  });
});
