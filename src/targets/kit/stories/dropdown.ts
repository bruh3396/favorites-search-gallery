import { DropdownOption, DropdownSize, createDropdown } from "@/core/ui/components/dropdown/dropdown";
import { Story } from "@/targets/kit/story";

interface DropdownState {
  options: readonly DropdownOption<string>[];
  value: string;
  disabled?: boolean;
  size?: DropdownSize;
}

const SORTS = [
  { value: "score", label: "Score" },
  { value: "date", label: "Date uploaded" },
  { value: "random", label: "Random" }
] as const;

const COLUMNS = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} columns` }));

// Each variant closes the controlled loop itself: whatever the dropdown reports is told straight back to it.
function variant(label: string, { options, value, disabled = false, size }: DropdownState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const control = createDropdown(ownerDocument, {
        options,
        size,
        onValueChange: (next) => {
          log(`Dropdown "${label}" → ${next}`);
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

export const DROPDOWN_STORY: Story = {
  title: "Dropdown",
  variants: [
    variant("Three options", { options: SORTS, value: "score" }),
    variant("Long list", { options: COLUMNS, value: "6" }),
    variant("Small", { options: SORTS, value: "date", size: "small" }),
    variant("Disabled", { options: SORTS, value: "random", disabled: true })
  ]
};
