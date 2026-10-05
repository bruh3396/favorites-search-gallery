import { ControlSize } from "@/core/ui/components/control";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";
import { createDisclosure } from "@/core/ui/components/disclosure/disclosure";

interface DisclosureState {
  open: boolean;
  disabled?: boolean;
  size?: ControlSize;
}

function variant(label: string, { open: initial, disabled = false, size }: DisclosureState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const content = ownerDocument.createElement("p");
      const open = new Signal(initial);
      const control = createDisclosure(ownerDocument, {
        title: "Appearance",
        content,
        value: open,
        disabled: new Signal(disabled),
        size,
        onValueChange: next => {
          log(`Disclosure "${label}" → ${next}`);
          open.value = next;
        }
      });

      content.textContent = "Whatever the section holds.";
      return control.element;
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
