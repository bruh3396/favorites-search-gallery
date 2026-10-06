import { h, render } from "@/core/ui/h/h";
import { ControlSize } from "@/core/ui/components/control";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";
import { Switch } from "@/core/ui/components/switch/switch";

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
      const { result: element } = render(ownerDocument, () => (
        <Switch
          value={checked}
          disabled={new Signal(disabled)}
          size={size}
          onValueChange={next => {
            log(`Switch "${label}" → ${next}`);
            checked.value = next;
          }}
        />
      ));

      element.setAttribute("aria-label", label);
      return element;
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
