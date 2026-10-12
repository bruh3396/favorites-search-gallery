import { describe, expect, test } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { OverlayVisibility } from "@/core/ui/lightbox/overlay/visibility";

function setup(): { visibility: OverlayVisibility; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  return { visibility: new OverlayVisibility({ idleDelay: 2_000, shortDelay: 1_000 }, scheduler), scheduler };
}

describe("OverlayVisibility", () => {
  test("starts hidden", () => {
    expect(setup().visibility.shown.value).toBe(false);
  });

  describe("show", () => {
    test("shows until the idle delay passes", () => {
      const { visibility, scheduler } = setup();

      visibility.show();
      scheduler.advance(1_999);
      expect(visibility.shown.value).toBe(true);
      scheduler.advance(1);
      expect(visibility.shown.value).toBe(false);
    });

    test("restarts the idle delay", () => {
      const { visibility, scheduler } = setup();

      visibility.show();
      scheduler.advance(1_500);
      visibility.show();
      scheduler.advance(1_500);
      expect(visibility.shown.value).toBe(true);
    });

    test("keeps a hold", () => {
      const { visibility, scheduler } = setup();

      visibility.hold();
      visibility.show();
      scheduler.advance(10_000);
      expect(visibility.shown.value).toBe(true);
    });
  });

  describe("hold", () => {
    test("keeps it shown past the idle delay", () => {
      const { visibility, scheduler } = setup();

      visibility.show();
      visibility.hold();
      scheduler.advance(10_000);
      expect(visibility.shown.value).toBe(true);
    });
  });

  describe("release", () => {
    test("hides once the idle delay passes after it", () => {
      const { visibility, scheduler } = setup();

      visibility.show();
      visibility.hold();
      scheduler.advance(5_000);
      visibility.release();
      scheduler.advance(1_999);
      expect(visibility.shown.value).toBe(true);
      scheduler.advance(1);
      expect(visibility.shown.value).toBe(false);
    });
  });

  describe("hideSoon", () => {
    test("hides after the short delay, ending a hold", () => {
      const { visibility, scheduler } = setup();

      visibility.show();
      visibility.hold();
      visibility.hideSoon();
      scheduler.advance(999);
      expect(visibility.shown.value).toBe(true);
      scheduler.advance(1);
      expect(visibility.shown.value).toBe(false);
    });

    test("leaves it hidden when it already is", () => {
      const { visibility, scheduler } = setup();

      visibility.hideSoon();
      expect(visibility.shown.value).toBe(false);
      scheduler.advance(1_000);
      expect(visibility.shown.value).toBe(false);
    });
  });

  describe("hide", () => {
    test("hides at once and cancels the pending hide", () => {
      const { visibility, scheduler } = setup();

      visibility.show();
      visibility.hide();
      expect(visibility.shown.value).toBe(false);
      visibility.hold();
      visibility.show();
      scheduler.advance(2_000);
      expect(visibility.shown.value).toBe(true);
    });

    test("ends a hold", () => {
      const { visibility, scheduler } = setup();

      visibility.hold();
      visibility.hide();
      visibility.show();
      scheduler.advance(2_000);
      expect(visibility.shown.value).toBe(false);
    });
  });
});
