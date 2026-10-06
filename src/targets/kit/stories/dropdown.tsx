import { ControlChoice, ControlSize } from "@/core/ui/components/control";
import { h, render } from "@/core/ui/h/h";
import { Dropdown } from "@/core/ui/components/dropdown/dropdown";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";

interface DropdownState {
  choices: readonly ControlChoice<string>[];
  value: string;
  disabled?: boolean;
  size?: ControlSize;
}

const SORTS = [
  { value: "score", label: "Score" },
  { value: "date", label: "Date uploaded" },
  { value: "random", label: "Random" }
] as const;

const COLUMNS = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} columns` }));

// Each variant closes the controlled loop itself: whatever the dropdown reports is written back to its value.
function variant(label: string, { choices, value: initial, disabled = false, size }: DropdownState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const selected = new Signal(initial);
      const { result: element } = render(ownerDocument, () => (
        <Dropdown
          choices={choices}
          value={selected}
          disabled={new Signal(disabled)}
          size={size}
          onValueChange={next => {
            log(`Dropdown "${label}" → ${next}`);
            selected.value = next;
          }}
        />
      ));

      element.setAttribute("aria-label", label);
      return element;
    }
  };
}

export const DROPDOWN_STORY: Story = {
  title: "Dropdown",
  variants: [
    variant("Three choices", { choices: SORTS, value: "score" }),
    variant("Long list", { choices: COLUMNS, value: "6" }),
    variant("Small", { choices: SORTS, value: "date", size: "small" }),
    variant("Disabled", { choices: SORTS, value: "random", disabled: true })
  ]
};
