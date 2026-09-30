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

  test("never runs a cancelled task", () => {
    const task = vi.fn();

    new BrowserScheduler().schedule(task, 100)();
    vi.advanceTimersByTime(100);

    expect(task).not.toHaveBeenCalled();
  });
});
