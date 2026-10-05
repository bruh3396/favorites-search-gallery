import { doNothing } from "@/core/utils/function/function";

const HOLD_DELAY = 400;
const REPEAT_INTERVAL = 60;

export interface StepGestureDependencies {
  schedule: (task: () => void, delay: number) => () => void;
  getValue: () => number;
  commit: (value: number) => void;
}

// One gesture on a stepper (a press, a held key, a typed value) may step many times, but commits once when it ends,
// and only if the value moved.
export class StepGesture {
  private startValue: number | null = null;
  private stopRepeating = doNothing;

  constructor(private readonly dependencies: StepGestureDependencies) { }

  public begin(): void {
    this.startValue ??= this.dependencies.getValue();
  }

  // Steps again after a pause, then on an interval, until the gesture finishes or a step returns false.
  public repeat(step: () => boolean): void {
    this.scheduleStep(step, HOLD_DELAY);
  }

  public finish(): void {
    const { getValue, commit } = this.dependencies;

    this.stopRepeating();
    this.stopRepeating = doNothing;

    if (this.startValue !== null && getValue() !== this.startValue) {
      commit(getValue());
    }
    this.startValue = null;
  }

  private scheduleStep(step: () => boolean, delay: number): void {
    this.stopRepeating = this.dependencies.schedule(() => {
      if (step()) {
        this.scheduleStep(step, REPEAT_INTERVAL);
      }
    }, delay);
  }
}
