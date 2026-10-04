import { MultiSelectSize, createMultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { Story } from "@/targets/kit/story";

interface MultiSelectState {
  values: readonly string[];
  disabled?: boolean;
  size?: MultiSelectSize;
}

const ACTIONS = [
  { value: "favorite", label: "Favorite" },
  { value: "download", label: "Download" },
  { value: "open", label: "Open" }
] as const;

// Each variant closes the controlled loop itself: whatever the group reports is told straight back to it.
function variant(label: string, { values, disabled = false, size }: MultiSelectState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const control = createMultiSelect<string>(ownerDocument, {
        options: ACTIONS,
        size,
        onValueChange: next => {
          log(`MultiSelect "${label}" → [${next.join(", ")}]`);
          control.setValue(next);
        }
      });

      control.element.setAttribute("aria-label", label);
      control.setValue(values);
      control.setDisabled(disabled);
      return control.element;
    }
  };
}

export const MULTI_SELECT_STORY: Story = {
  title: "Multi-select",
  variants: [
    variant("Two pressed", { values: ["favorite", "open"] }),
    variant("One pressed (locked)", { values: ["download"] }),
    variant("Small", { values: ["favorite", "download", "open"], size: "small" }),
    variant("Disabled", { values: ["favorite"], disabled: true })
  ]
};
