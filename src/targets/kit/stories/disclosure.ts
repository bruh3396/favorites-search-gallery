import { DisclosureSize, createDisclosure } from "@/core/ui/components/disclosure/disclosure";
import { Story } from "@/targets/kit/story";

interface DisclosureState {
  open: boolean;
  disabled?: boolean;
  size?: DisclosureSize;
}

function variant(label: string, { open, disabled = false, size }: DisclosureState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const content = ownerDocument.createElement("p");
      const control = createDisclosure(ownerDocument, {
        title: "Appearance",
        content,
        size,
        onValueChange: (next) => {
          log(`Disclosure "${label}" → ${next}`);
          control.setValue(next);
        }
      });

      content.textContent = "Whatever the section holds.";
      control.setValue(open);
      control.setDisabled(disabled);
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
