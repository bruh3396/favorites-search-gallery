import { describe, expect, test, vi } from "vitest";
import { StepGesture } from "@/core/ui/components/stepper/step_gesture";

interface PendingTask {
  task: () => void;
  delay: number;
}

interface Setup {
  gesture: StepGesture;
  commit: ReturnType<typeof vi.fn<(value: number) => void>>;
  setValue: (next: number) => void;
  runNext: () => number;
}

// Runs scheduled tasks only when the test says so; runNext answers the delay it ran, or -1 when nothing is pending.
function setup(initial = 0): Setup {
  let value = initial;
  let pending: PendingTask | undefined;
  const commit = vi.fn<(value: number) => void>();
  const gesture = new StepGesture({
    schedule: (task, delay): (() => void) => {
      const entry = { task, delay };

      pending = entry;
      return (): void => {
        if (pending === entry) {
          pending = undefined;
        }
      };
    },
    getValue: (): number => value,
    commit
  });
  return {
    gesture,
    commit,
    setValue: (next): void => {
      value = next;
    },
    runNext: (): number => {
      const entry = pending;

      if (entry === undefined) {
        return -1;
      }
      pending = undefined;
      entry.task();
      return entry.delay;
    }
  };
}

describe("StepGesture", () => {
  test("commits the value a gesture ends on", () => {
    const { gesture, commit, setValue } = setup(3);

    gesture.begin();
    setValue(5);
    gesture.finish();
    expect(commit.mock.calls).toEqual([[5]]);
  });

  test("commits nothing when the gesture ends where it started", () => {
    const { gesture, commit, setValue } = setup(3);

    gesture.begin();
    setValue(4);
    setValue(3);
    gesture.finish();
    expect(commit).not.toHaveBeenCalled();
  });

  test("keeps the first start when begun again mid-gesture", () => {
    const { gesture, commit, setValue } = setup(3);

    gesture.begin();
    setValue(4);
    gesture.begin();
    gesture.finish();
    expect(commit.mock.calls).toEqual([[4]]);
  });

  test("commits nothing when finished without beginning", () => {
    const { gesture, commit, setValue } = setup(3);

    setValue(4);
    gesture.finish();
    expect(commit).not.toHaveBeenCalled();
  });

  test("repeats after a pause, then on an interval", () => {
    const { gesture, runNext } = setup();
    const step = vi.fn((): boolean => true);

    gesture.repeat(step);
    expect([runNext(), runNext(), runNext()]).toEqual([400, 60, 60]);
    expect(step).toHaveBeenCalledTimes(3);
  });

  test("stops repeating when a step returns false", () => {
    const { gesture, runNext } = setup();

    gesture.repeat(() => false);
    runNext();
    expect(runNext()).toBe(-1);
  });

  test("stops repeating when finished", () => {
    const { gesture, runNext } = setup();

    gesture.repeat(() => true);
    gesture.finish();
    expect(runNext()).toBe(-1);
  });
});
