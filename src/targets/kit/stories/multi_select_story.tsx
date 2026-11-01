import { h, render } from "@/core/ui/h/h";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { MultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";

interface MultiSelectState {
  readonly values: readonly string[];
  readonly disabled?: boolean;
  readonly controlSize?: ControlSize;
}

const ACTIONS = [
  { value: "favorite", label: "Favorite" },
  { value: "download", label: "Download" },
  { value: "open", label: "Open" }
] as const;

function variant(label: string, { values, disabled = false, controlSize }: MultiSelectState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const pressed = new Signal(values);
      const { result: element } = render(ownerDocument, () => (
        <MultiSelect<string>
          controlChoices={ACTIONS}
          value={pressed}
          disabled={new Signal(disabled)}
          size={controlSize}
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
    variant("Small", { values: ["favorite", "download", "open"], controlSize: "small" }),
    variant("Disabled", { values: ["favorite"], disabled: true })
  ]
};
