import { ControlChoice, ControlProps, NEVER_DISABLED } from "@/core/ui/components/control";
import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const SegmentedClass = {
  root: "fsg-Segmented",
  option: "fsg-Segmented-option"
} as const;

export interface SegmentedProps<T> extends ControlProps<T> {
  choices: readonly ControlChoice<T>[];
}

// WAI-ARIA APG radio group: arrows move and select, wrapping at the ends; Home and End jump to the ends.
const KEY_STEPS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowDown: (index, count) => (index + 1) % count,
  Home: () => 0,
  End: (_, count) => count - 1
};

export function Segmented<T>({ choices, value, disabled = NEVER_DISABLED, onValueChange, size = "medium" }: SegmentedProps<T>): HTMLElement {
  const findCheckedIndex = (checked: T): number => choices.findIndex(choice => choice.value === checked);
  const checkedIndex = computed(() => findCheckedIndex(value.value));
  // Roving tabindex: only the checked choice is a tab stop, or the first one while none is checked.
  const tabStop = computed(() => Math.max(checkedIndex.value, 0));
  const select = (index: number): void => {
    if (index !== findCheckedIndex(value.peek())) {
      onValueChange(choices[index].value);
    }
  };
  const buttons = choices.map(({ label }, index) => (
    <button
      className={SegmentedClass.option}
      type="button"
      role="radio"
      aria-checked={computed(() => String(checkedIndex.value === index))}
      tabIndex={computed(() => (tabStop.value === index ? 0 : -1))}
      disabled={disabled}
      onClick={() => select(index)}
    >
      {label}
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
    <div className={SegmentedClass.root} role="radiogroup" dataset={{ size }} onKeydown={moveFocus}>
      {buttons}
    </div>
  );
}
