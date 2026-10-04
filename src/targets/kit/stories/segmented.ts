import { SegmentedOption, SegmentedSize, createSegmented } from "@/core/ui/components/segmented/segmented";
import { Story } from "@/targets/kit/story";

interface SegmentedState {
  options: readonly SegmentedOption<string>[];
  value: string;
  disabled?: boolean;
  size?: SegmentedSize;
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

// Each variant closes the controlled loop itself: whatever the group reports is told straight back to it.
function variant(label: string, { options, value, disabled = false, size }: SegmentedState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const control = createSegmented(ownerDocument, {
        options,
        size,
        onValueChange: next => {
          log(`Segmented "${label}" → ${next}`);
          control.setValue(next);
        }
      });

      control.element.setAttribute("aria-label", label);
      control.setValue(value);
      control.setDisabled(disabled);
      return control.element;
    }
  };
}

export const SEGMENTED_STORY: Story = {
  title: "Segmented",
  variants: [
    variant("Three options", { options: LAYOUTS, value: "column" }),
    variant("Two options", { options: ORDERS, value: "descending" }),
    variant("Small", { options: LAYOUTS, value: "row", size: "small" }),
    variant("Disabled", { options: LAYOUTS, value: "square", disabled: true })
  ]
};
