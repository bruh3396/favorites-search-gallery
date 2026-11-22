import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { h } from "@/core/ui/h/h";

export const TabListClass = {
  root: "fsg-TabList",
  tab: "fsg-TabList-tab"
} as const;

export interface TabListProps<Value> {
  label: string;
  controlChoices: readonly ControlChoice<Value>[];
  value: Readable<Value>;
  panel: HTMLElement;
  onValueChange: (value: Value) => void;
}

const KEY_STEPS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowRight: (index, count) => (index + 1) % count,
  Home: () => 0,
  End: (_, count) => count - 1
};

export function TabList<Value>({ label, controlChoices, value, panel, onValueChange }: TabListProps<Value>): HTMLElement {
  const findSelectedIndex = (selectedValue: Value): number => controlChoices.findIndex(controlChoice => controlChoice.value === selectedValue);
  const selectedIndex = computed(() => findSelectedIndex(value.value));
  const tabStop = computed(() => Math.max(selectedIndex.value, 0));
  const select = (index: number): void => {
    if (index !== findSelectedIndex(value.peek())) {
      onValueChange(controlChoices[index].value);
    }
  };
  const tabs = controlChoices.map((controlChoice, index) => {
    const tab = (
      <button
        className={TabListClass.tab}
        type="button"
        role="tab"
        aria-selected={computed(() => String(selectedIndex.value === index))}
        tabIndex={computed(() => (tabStop.value === index ? 0 : -1))}
        onClick={() => select(index)}
      >
        {controlChoice.label}
      </button>
    );

    tab.ariaControlsElements = [panel];
    return tab;
  });

  panel.role = "tabpanel";
  effect(() => {
    panel.ariaLabelledByElements = [tabs[tabStop.value]];
  });
  const moveFocus = (event: KeyboardEvent): void => {
    const step = KEY_STEPS[event.key];
    const from = tabs.indexOf(event.target as HTMLButtonElement);

    if (step === undefined || from === -1) {
      return;
    }
    event.preventDefault();
    const to = step(from, tabs.length);

    tabs[to].focus();
    select(to);
  };
  return (
    <div className={TabListClass.root} role="tablist" aria-label={label} onKeydown={moveFocus}>
      {tabs}
    </div>
  );
}
