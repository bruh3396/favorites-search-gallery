import { ControlProps, NEVER_DISABLED } from "@/core/ui/components/control";
import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const DisclosureClass = {
  root: "fsg-Disclosure",
  trigger: "fsg-Disclosure-trigger",
  title: "fsg-Disclosure-title",
  icon: "fsg-Disclosure-icon"
} as const;

export interface DisclosureProps extends ControlProps<boolean> {
  title: string;
  content: HTMLElement;
}

export function Disclosure({ title, content, value, disabled = NEVER_DISABLED, size = "medium", onValueChange }: DisclosureProps): HTMLElement {
  const region = <div hidden={computed(() => !value.value)}>{content}</div>;
  const trigger = (
    <button
      className={DisclosureClass.trigger}
      type="button"
      aria-expanded={computed(() => String(value.value))}
      disabled={disabled}
      onClick={() => onValueChange(!value.peek())}
    >
      <span className={DisclosureClass.title}>{title}</span>
      <span className={DisclosureClass.icon} aria-hidden="true" />
    </button>
  );

  trigger.ariaControlsElements = [region];
  return (
    <div className={DisclosureClass.root} dataset={{ size }}>
      {trigger}
      {region}
    </div>
  );
}
