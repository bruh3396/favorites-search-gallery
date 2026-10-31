import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlProps } from "@/core/ui/components/control/control_props";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export const SegmentedClass = {
  root: "fsg-Segmented",
  option: "fsg-Segmented-option",
  icon: "fsg-Segmented-icon"
} as const;

export interface SegmentedProps<Value> extends ControlProps<Value> {
  controlChoices: readonly ControlChoice<Value>[];
}

const KEY_STEPS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowDown: (index, count) => (index + 1) % count,
  Home: () => 0,
  End: (_, count) => count - 1
};

export function Segmented<Value>({ controlChoices, value, disabled = new Signal(false), onValueChange, size: controlSize = "medium" }: SegmentedProps<Value>): HTMLElement {
  const findCheckedIndex = (checkedValue: Value): number => controlChoices.findIndex(controlChoice => controlChoice.value === checkedValue);
  const checkedIndex = computed(() => findCheckedIndex(value.value));
  const tabStop = computed(() => Math.max(checkedIndex.value, 0));
  const select = (index: number): void => {
    if (index !== findCheckedIndex(value.peek())) {
      onValueChange(controlChoices[index].value);
    }
  };
  const buttons = controlChoices.map(({ label, icon }, index) => (
    <button
      className={SegmentedClass.option}
      type="button"
      role="radio"
      aria-label={icon === undefined ? undefined : label}
      title={icon === undefined ? undefined : label}
      aria-checked={computed(() => String(checkedIndex.value === index))}
      tabIndex={computed(() => (tabStop.value === index ? 0 : -1))}
      disabled={disabled}
      onClick={() => select(index)}
    >
      {icon === undefined ? label : createIcon(icon, SegmentedClass.icon)}
    </button>
  ));
  const moveFocus = (event: KeyboardEvent): void => {
    const step = KEY_STEPS[event.key];
    const from = buttons.indexOf(event.target as HTMLElement);

    if (step === undefined || from === -1) {
      return;
    }
    event.preventDefault();
    const to = step(from, buttons.length);

    buttons[to].focus();
    select(to);
  };
  return (
    <div className={SegmentedClass.root} role="radiogroup" dataset={{ size: controlSize }} onKeydown={moveFocus}>
      {buttons}
    </div>
  );
}
