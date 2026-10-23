import { UPSCALE_PACER_CONFIGURATION, UpscalePacer } from "@/core/ui/post_grid/upscale_pacer";
import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

const { quietPeriod, paintInterval } = UPSCALE_PACER_CONFIGURATION;

function setup(): { pacer: UpscalePacer; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  return { pacer: new UpscalePacer(UPSCALE_PACER_CONFIGURATION, scheduler), scheduler };
}

describe("UpscalePacer", () => {
  describe("decodeWhenQuiet", () => {
    test("runs held decodes together once none is requested for the quiet period", () => {
      const { pacer, scheduler } = setup();
      const first = vi.fn();
      const second = vi.fn();

      pacer.decodeWhenQuiet(first);
      scheduler.advance(quietPeriod - 1);
      pacer.decodeWhenQuiet(second);
      scheduler.advance(quietPeriod - 1);
      expect([first.mock.calls.length, second.mock.calls.length]).toEqual([0, 0]);
      scheduler.advance(1);
      expect([first.mock.calls.length, second.mock.calls.length]).toEqual([1, 1]);
    });

    test("drops a decode cancelled before the quiet period ends", () => {
      const { pacer, scheduler } = setup();
      const decode = vi.fn();

      pacer.decodeWhenQuiet(decode)();
      scheduler.advance(quietPeriod);
      expect(decode).not.toHaveBeenCalled();
    });
  });

  describe("queuePaint", () => {
    test("runs the first paint at once and spaces the rest by the paint interval", () => {
      const { pacer, scheduler } = setup();
      const paints = [vi.fn(), vi.fn(), vi.fn()];
      const countRun = (): number => paints.filter(paint => paint.mock.calls.length === 1).length;

      paints.forEach(paint => pacer.queuePaint(paint));
      expect(countRun()).toBe(1);
      scheduler.advance(paintInterval - 1);
      expect(countRun()).toBe(1);
      scheduler.advance(1);
      expect(countRun()).toBe(2);
      scheduler.advance(paintInterval);
      expect(countRun()).toBe(3);
    });

    test("runs a paint at once after the queue has drained", () => {
      const { pacer, scheduler } = setup();
      const paint = vi.fn();

      pacer.queuePaint(vi.fn());
      scheduler.advance(paintInterval);
      pacer.queuePaint(paint);
      expect(paint).toHaveBeenCalledOnce();
    });
  });
});
