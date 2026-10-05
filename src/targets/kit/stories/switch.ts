import { ControlSize } from "@/core/ui/components/control";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";
import { createSwitch } from "@/core/ui/components/switch/switch";

interface SwitchState {
  checked: boolean;
  disabled?: boolean;
  size?: ControlSize;
}

function variant(label: string, { checked: initial, disabled = false, size }: SwitchState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const checked = new Signal(initial);
      const control = createSwitch(ownerDocument, {
        value: checked,
        disabled: new Signal(disabled),
        size,
        onValueChange: next => {
          log(`Switch "${label}" → ${next}`);
          checked.value = next;
        }
      });

      control.element.setAttribute("aria-label", label);
      return control.element;
    }
  };
}

export const SWITCH_STORY: Story = {
  title: "Switch",
  variants: [
    variant("Off", { checked: false }),
    variant("On", { checked: true }),
    variant("Disabled off", { checked: false, disabled: true }),
    variant("Disabled on", { checked: true, disabled: true }),
    variant("Small", { checked: false, size: "small" }),
    variant("Small on", { checked: true, size: "small" })
  ]
};
