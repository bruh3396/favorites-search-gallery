import { describe, expect, test, vi } from "vitest";
import { StepGesture } from "@/core/ui/components/stepper/step_gesture";

interface PendingTask {
  task: () => void;
  delay: number;
}

interface Setup {
  stepGesture: StepGesture;
  commit: ReturnType<typeof vi.fn<(value: number) => void>>;
  setValue: (next: number) => void;
  runNext: () => number;
}

function setup(initial = 0): Setup {
  let value = initial;
  let pendingTask: PendingTask | undefined;
  const commit = vi.fn<(value: number) => void>();
  const stepGesture = new StepGesture({
    schedule: (task, delay): (() => void) => {
      const entry = { task, delay };

      pendingTask = entry;
      return (): void => {
        if (pendingTask === entry) {
          pendingTask = undefined;
        }
      };
    },
    getValue: (): number => value,
    commit
  });
  return {
    stepGesture,
    commit,
    setValue: (next): void => {
      value = next;
    },
    runNext: (): number => {
      const currentPendingTask = pendingTask;

      if (currentPendingTask === undefined) {
        return -1;
      }
      pendingTask = undefined;
      currentPendingTask.task();
      return currentPendingTask.delay;
    }
  };
}

describe("StepGesture", () => {
  test("commits the value a gesture ends on", () => {
    const { stepGesture, commit, setValue } = setup(3);

    stepGesture.begin();
    setValue(5);
    stepGesture.finish();
    expect(commit.mock.calls).toEqual([[5]]);
  });

  test("commits nothing when the gesture ends where it started", () => {
    const { stepGesture, commit, setValue } = setup(3);

    stepGesture.begin();
    setValue(4);
    setValue(3);
    stepGesture.finish();
    expect(commit).not.toHaveBeenCalled();
  });

  test("keeps the first start when begun again mid-gesture", () => {
    const { stepGesture, commit, setValue } = setup(3);

    stepGesture.begin();
    setValue(4);
    stepGesture.begin();
    stepGesture.finish();
    expect(commit.mock.calls).toEqual([[4]]);
  });

  test("commits nothing when finished without beginning", () => {
    const { stepGesture, commit, setValue } = setup(3);

    setValue(4);
    stepGesture.finish();
    expect(commit).not.toHaveBeenCalled();
  });

  test("repeats after a pause, then on an interval", () => {
    const { stepGesture, runNext } = setup();
    const step = vi.fn((): boolean => true);

    stepGesture.repeat(step);
    expect([runNext(), runNext(), runNext()]).toEqual([400, 60, 60]);
    expect(step).toHaveBeenCalledTimes(3);
  });

  test("stops repeating when a step returns false", () => {
    const { stepGesture, runNext } = setup();

    stepGesture.repeat(() => false);
    runNext();
    expect(runNext()).toBe(-1);
  });

  test("stops repeating when finished", () => {
    const { stepGesture, runNext } = setup();

    stepGesture.repeat(() => true);
    stepGesture.finish();
    expect(runNext()).toBe(-1);
  });
});
