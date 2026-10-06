import { h, render } from "@/core/ui/h/h";
import { ControlSize } from "@/core/ui/components/control";
import { Disclosure } from "@/core/ui/components/disclosure/disclosure";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";

interface DisclosureState {
  open: boolean;
  disabled?: boolean;
  size?: ControlSize;
}

function variant(label: string, { open: initial, disabled = false, size }: DisclosureState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const open = new Signal(initial);
      const { result } = render(ownerDocument, () => (
        <Disclosure
          title="Appearance"
          content={<p>Whatever the section holds.</p>}
          value={open}
          disabled={new Signal(disabled)}
          size={size}
          onValueChange={next => {
            log(`Disclosure "${label}" → ${next}`);
            open.value = next;
          }}
        />
      ));
      return result;
    }
  };
}

export const DISCLOSURE_STORY: Story = {
  title: "Disclosure",
  variants: [
    variant("Closed", { open: false }),
    variant("Open", { open: true }),
    variant("Disabled", { open: false, disabled: true }),
    variant("Small open", { open: true, size: "small" })
  ]
};
