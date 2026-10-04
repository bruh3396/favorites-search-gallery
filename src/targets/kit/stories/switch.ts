import { SwitchSize, createSwitch } from "@/core/ui/components/switch/switch";
import { Story } from "@/targets/kit/story";

interface SwitchState {
  checked: boolean;
  disabled?: boolean;
  size?: SwitchSize;
}

// Each variant closes the controlled loop itself: whatever the switch reports is told straight back to it.
function variant(label: string, { checked, disabled = false, size }: SwitchState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const control = createSwitch(ownerDocument, {
        size,
        onValueChange: next => {
          log(`Switch "${label}" → ${next}`);
          control.setValue(next);
        }
      });

      control.element.setAttribute("aria-label", label);
      control.setValue(checked);
      control.setDisabled(disabled);
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
