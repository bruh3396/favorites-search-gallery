import { h, render } from "@/core/ui/h/h";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { Dropdown } from "@/core/ui/components/dropdown/dropdown";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";

interface DropdownState {
  readonly controlChoices: readonly ControlChoice<string>[];
  readonly value: string;
  readonly disabled?: boolean;
  readonly controlSize?: ControlSize;
}

const SORTS = [
  { value: "score", label: "Score" },
  { value: "date", label: "Date uploaded" },
  { value: "random", label: "Random" }
] as const;

const COLUMNS = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} columns` }));

function variant(label: string, { controlChoices, value: initial, disabled = false, controlSize }: DropdownState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const selected = new Signal(initial);
      const { result: element } = render(ownerDocument, () => (
        <Dropdown
          controlChoices={controlChoices}
          value={selected}
          disabled={new Signal(disabled)}
          size={controlSize}
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
    variant("Three choices", { controlChoices: SORTS, value: "score" }),
    variant("Long list", { controlChoices: COLUMNS, value: "6" }),
    variant("Small", { controlChoices: SORTS, value: "date", controlSize: "small" }),
    variant("Disabled", { controlChoices: SORTS, value: "random", disabled: true })
  ]
};
