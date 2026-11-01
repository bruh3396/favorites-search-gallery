import { h, render } from "@/core/ui/h/h";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";

interface SegmentedState {
  readonly controlChoices: readonly ControlChoice<string>[];
  readonly value: string;
  readonly disabled?: boolean;
  readonly controlSize?: ControlSize;
}

const LAYOUTS = [
  { value: "column", label: "Column" },
  { value: "row", label: "Row" },
  { value: "square", label: "Square" }
] as const;

const ORDERS = [
  { value: "descending", label: "Descending" },
  { value: "ascending", label: "Ascending" }
] as const;

function variant(label: string, { controlChoices, value: initial, disabled = false, controlSize }: SegmentedState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const selected = new Signal(initial);
      const { result: element } = render(ownerDocument, () => (
        <Segmented
          controlChoices={controlChoices}
          value={selected}
          disabled={new Signal(disabled)}
          size={controlSize}
          onValueChange={next => {
            log(`Segmented "${label}" → ${next}`);
            selected.value = next;
          }}
        />
      ));

      element.setAttribute("aria-label", label);
      return element;
    }
  };
}

export const SEGMENTED_STORY: Story = {
  title: "Segmented",
  variants: [
    variant("Three choices", { controlChoices: LAYOUTS, value: "column" }),
    variant("Two choices", { controlChoices: ORDERS, value: "descending" }),
    variant("Small", { controlChoices: LAYOUTS, value: "row", controlSize: "small" }),
    variant("Disabled", { controlChoices: LAYOUTS, value: "square", disabled: true })
  ]
};
