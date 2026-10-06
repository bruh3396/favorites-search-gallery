import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";

describe("BrowserScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("runs the task after the delay", () => {
    const task = vi.fn();

    new BrowserScheduler().schedule(task, 100);
    vi.advanceTimersByTime(99);
    expect(task).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(task).toHaveBeenCalledOnce();
  });

  test("reads the wall clock in epoch milliseconds", () => {
    vi.setSystemTime(1_700_000_000_000);

    expect(new BrowserScheduler().now()).toBe(1_700_000_000_000);
  });

  test("never runs a cancelled task", () => {
    const task = vi.fn();

    new BrowserScheduler().schedule(task, 100)();
    vi.advanceTimersByTime(100);

    expect(task).not.toHaveBeenCalled();
  });

  test("wakes a sleep after the duration", async() => {
    const wake = vi.fn();

    new BrowserScheduler().sleep(100).then(wake);
    await vi.advanceTimersByTimeAsync(99);
    expect(wake).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(wake).toHaveBeenCalledOnce();
  });

  test("waits for the next frame to be drawn before resolving", async() => {
    const frames: FrameRequestCallback[] = [];
    const wake = vi.fn();

    vi.stubGlobal("requestAnimationFrame", (frame: FrameRequestCallback): number => frames.push(frame));
    new BrowserScheduler().waitForPaint().then(wake);
    await vi.advanceTimersByTimeAsync(0);
    expect(wake).not.toHaveBeenCalled();
    frames.forEach(frame => frame(0));
    await vi.advanceTimersByTimeAsync(0);
    expect(wake).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
