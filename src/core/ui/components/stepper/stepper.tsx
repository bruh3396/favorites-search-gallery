import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { ControlProps } from "@/core/ui/components/control/control_props";
import { StepGesture } from "@/core/ui/components/stepper/step_gesture";
import { doNothing } from "@/core/utils/function/function_utilities";
import { h } from "@/core/ui/h/h";

export const StepperClass = {
  root: "fsg-Stepper",
  input: "fsg-Stepper-input",
  button: "fsg-Stepper-button",
  icon: "fsg-Stepper-icon"
} as const;

export interface StepperScheduler {
  schedule: (task: () => void, delay: number) => () => void;
}

export interface StepperProps extends ControlProps<number> {
  label: string;
  min: number;
  max: number | Readable<number>;
  step?: number;
  isFocused?: Readable<boolean>;
  scheduler: StepperScheduler;
  onValueCommit?: (value: number) => void;
}

interface StepButtonProps {
  label: string;
  icon: Icon;
  disabled: Readable<boolean>;
  stepGesture: StepGesture;
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
  size: controlSize = "medium",
  isFocused,
  scheduler: stepperScheduler,
  value,
  disabled = new Signal(false),
  onValueChange,
  onValueCommit = doNothing
}: StepperProps): HTMLElement {
  const upper = typeof max === "number" ? new Signal(max) : max;
  const stepGesture = new StepGesture({
    schedule: (task, delay): (() => void) => stepperScheduler.schedule(task, delay),
    getValue: (): number => value.peek(),
    commit: onValueCommit
  });
  const reportIfChanged = (next: number): void => {
    if (next !== value.peek()) {
      onValueChange(next);
    }
  };
  const stepBy = (direction: 1 | -1): void => reportIfChanged(stepFrom(value.peek(), { direction, min, max: upper.peek(), step }));
  const finishGesture = (): void => stepGesture.finish();
  const input = (
    <input
      className={StepperClass.input}
      type="number"
      aria-label={label}
      min={String(min)}
      max={computed(() => String(upper.value))}
      step={String(step)}
      value={computed(() => String(value.value))}
      disabled={disabled}
      onKeydown={event => {
        const direction = KEY_DIRECTIONS[event.key];

        if (direction !== undefined) {
          event.preventDefault();
          stepGesture.begin();
          stepBy(direction);
        }
      }}
      onKeyup={event => {
        if (KEY_DIRECTIONS[event.key] !== undefined) {
          stepGesture.finish();
        }
      }}
      onBlur={finishGesture}
      onChange={event => {
        const typed = event.currentTarget.valueAsNumber;

        event.currentTarget.value = String(value.peek());

        if (!Number.isNaN(typed)) {
          stepGesture.begin();
          reportIfChanged(Math.min(upper.peek(), Math.max(min, typed)));
          stepGesture.finish();
        }
      }}
    />
  ) as HTMLInputElement;

  effect(() => {
    if (disabled.value) {
      stepGesture.finish();
    }
  });

  if (isFocused !== undefined) {
    effect(() => {
      if (isFocused.value) {
        input.focus();
        input.select();
      }
    });
  }
  return (
    <div className={StepperClass.root} dataset={{ size: controlSize }}>
      <StepButton
        label="Decrease"
        icon="subtract"
        disabled={computed(() => disabled.value || value.value <= min)}
        stepGesture={stepGesture}
        onStep={() => stepBy(-1)}
      />
      {input}
      <StepButton
        label="Increase"
        icon="add"
        disabled={computed(() => disabled.value || value.value >= upper.value)}
        stepGesture={stepGesture}
        onStep={() => stepBy(1)}
      />
    </div>
  );
}

function StepButton({ label, icon, disabled, stepGesture, onStep }: StepButtonProps): HTMLElement {
  const finishGesture = (): void => stepGesture.finish();
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
        stepGesture.finish();
        stepGesture.begin();
        onStep();
        stepGesture.repeat(stepIfEnabled);
      }}
      onClick={event => {
        if (event.detail === 0) {
          stepGesture.begin();
          onStep();
          stepGesture.finish();
        }
      }}
      onPointerup={finishGesture}
      onPointerleave={finishGesture}
      onPointercancel={finishGesture}
    >
      {createIcon(icon, StepperClass.icon)}
    </button>
  );
}

function stepFrom(
  value: number,
  { direction, min, max, step }: { direction: 1 | -1; min: number; max: number; step: number }
): number {
  const offset = roundToPrecision(value / step, OFFSET_PRECISION);
  const index = direction === 1 ? Math.floor(offset) + 1 : Math.ceil(offset) - 1;
  const next = roundToPrecision(index * step, countDecimals(step));
  return Math.min(max, Math.max(min, next));
}

function roundToPrecision(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function countDecimals(step: number): number {
  return String(step).split(".")[1]?.length ?? 0;
}
