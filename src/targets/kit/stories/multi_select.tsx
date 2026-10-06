import { h, render } from "@/core/ui/h/h";
import { ControlSize } from "@/core/ui/components/control";
import { MultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";

interface MultiSelectState {
  values: readonly string[];
  disabled?: boolean;
  size?: ControlSize;
}

const ACTIONS = [
  { value: "favorite", label: "Favorite" },
  { value: "download", label: "Download" },
  { value: "open", label: "Open" }
] as const;

// Each variant closes the controlled loop itself: whatever the group reports is written back to its value.
function variant(label: string, { values, disabled = false, size }: MultiSelectState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const pressed = new Signal(values);
      const { result: element } = render(ownerDocument, () => (
        <MultiSelect<string>
          choices={ACTIONS}
          value={pressed}
          disabled={new Signal(disabled)}
          size={size}
          onValueChange={next => {
            log(`MultiSelect "${label}" → [${next.join(", ")}]`);
            pressed.value = next;
          }}
        />
      ));

      element.setAttribute("aria-label", label);
      return element;
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
