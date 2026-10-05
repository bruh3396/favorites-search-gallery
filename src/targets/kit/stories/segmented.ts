import { ControlChoice, ControlSize } from "@/core/ui/components/control";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";
import { createSegmented } from "@/core/ui/components/segmented/segmented";

interface SegmentedState {
  choices: readonly ControlChoice<string>[];
  value: string;
  disabled?: boolean;
  size?: ControlSize;
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

// Each variant closes the controlled loop itself: whatever the group reports is written back to its value.
function variant(label: string, { choices, value: initial, disabled = false, size }: SegmentedState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const selected = new Signal(initial);
      const control = createSegmented(ownerDocument, {
        choices,
        value: selected,
        disabled: new Signal(disabled),
        size,
        onValueChange: next => {
          log(`Segmented "${label}" → ${next}`);
          selected.value = next;
        }
      });

      control.element.setAttribute("aria-label", label);
      return control.element;
    }
  };
}

export const SEGMENTED_STORY: Story = {
  title: "Segmented",
  variants: [
    variant("Three choices", { choices: LAYOUTS, value: "column" }),
    variant("Two choices", { choices: ORDERS, value: "descending" }),
    variant("Small", { choices: LAYOUTS, value: "row", size: "small" }),
    variant("Disabled", { choices: LAYOUTS, value: "square", disabled: true })
  ]
};
