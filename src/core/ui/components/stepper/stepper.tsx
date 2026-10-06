import { ControlProps, NEVER_DISABLED } from "@/core/ui/components/control";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { StepGesture } from "@/core/ui/components/stepper/step_gesture";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";

export const StepperClass = {
  root: "fsg-Stepper",
  input: "fsg-Stepper-input",
  button: "fsg-Stepper-button"
} as const;

export interface StepperScheduler {
  schedule: (task: () => void, delay: number) => () => void;
}

export interface StepperProps extends ControlProps<number> {
  label: string;
  min: number;
  max: number;
  step?: number;
  scheduler: StepperScheduler;
  onValueCommit?: (value: number) => void;
}

interface StepButtonProps {
  label: string;
  text: string;
  disabled: Readable<boolean>;
  gesture: StepGesture;
  onStep: () => void;
}

const OFFSET_PRECISION = 9;

const KEY_DIRECTIONS: Readonly<Record<string, 1 | -1>> = {
  ArrowUp: 1,
  ArrowDown: -1
};

export function Stepper({
  label,
  min,
  max,
  step = 1,
  size = "medium",
  scheduler,
  value,
  disabled = NEVER_DISABLED,
  onValueChange,
  onValueCommit = doNothing
}: StepperProps): HTMLElement {
  const gesture = new StepGesture({
    schedule: (task, delay): (() => void) => scheduler.schedule(task, delay),
    getValue: (): number => value.peek(),
    commit: onValueCommit
  });
  const reportIfChanged = (next: number): void => {
    if (next !== value.peek()) {
      onValueChange(next);
    }
  };
  const stepBy = (direction: 1 | -1): void => reportIfChanged(stepFrom(value.peek(), { direction, min, max, step }));
  const finishGesture = (): void => gesture.finish();

  effect(() => {
    if (disabled.value) {
      gesture.finish();
    }
  });
  return (
    <div className={StepperClass.root} dataset={{ size }}>
      <StepButton
        label="Decrease"
        text="−"
        disabled={computed(() => disabled.value || value.value <= min)}
        gesture={gesture}
        onStep={() => stepBy(-1)}
      />
      <input
        className={StepperClass.input}
        type="number"
        aria-label={label}
        min={String(min)}
        max={String(max)}
        step={String(step)}
        value={computed(() => String(value.value))}
        disabled={disabled}
        onKeydown={event => {
          const direction = KEY_DIRECTIONS[event.key];

          if (direction !== undefined) {
            event.preventDefault();
            gesture.begin();
            stepBy(direction);
          }
        }}
        onKeyup={event => {
          if (KEY_DIRECTIONS[event.key] !== undefined) {
            gesture.finish();
          }
        }}
        onBlur={finishGesture}
        onChange={event => {
          const typed = event.currentTarget.valueAsNumber;

          event.currentTarget.value = String(value.peek());

          if (!Number.isNaN(typed)) {
            gesture.begin();
            reportIfChanged(Math.min(max, Math.max(min, typed)));
            gesture.finish();
          }
        }}
      />
      <StepButton
        label="Increase"
        text="+"
        disabled={computed(() => disabled.value || value.value >= max)}
        gesture={gesture}
        onStep={() => stepBy(1)}
      />
    </div>
  );
}

function StepButton({ label, text, disabled, gesture, onStep }: StepButtonProps): HTMLElement {
  const finishGesture = (): void => gesture.finish();
  const stepIfEnabled = (): boolean => {
    if (disabled.peek()) {
      return false;
    }
    onStep();
    return true;
  };
  return (
    <button
      className={StepperClass.button}
      type="button"
      tabIndex={-1}
      aria-label={label}
      disabled={disabled}
      onPointerdown={event => {
        if (event.button !== 0 || disabled.peek()) {
          return;
        }
        event.preventDefault();
        gesture.finish();
        gesture.begin();
        onStep();
        gesture.repeat(stepIfEnabled);
      }}
      onClick={event => {
        if (event.detail === 0) {
          gesture.begin();
          onStep();
          gesture.finish();
        }
      }}
      onPointerup={finishGesture}
      onPointerleave={finishGesture}
      onPointercancel={finishGesture}
    >
      {text}
    </button>
  );
}

function stepFrom(
  value: number,
  { direction, min, max, step }: { direction: 1 | -1; min: number; max: number; step: number }
): number {
  const offset = roundToPrecision((value - min) / step, OFFSET_PRECISION);
  const index = direction === 1 ? Math.floor(offset) + 1 : Math.ceil(offset) - 1;
  const next = roundToPrecision(min + (index * step), countDecimals(step));
  return Math.min(max, Math.max(min, next));
}

function roundToPrecision(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function countDecimals(step: number): number {
  return String(step).split(".")[1]?.length ?? 0;
}
