import { Readable, computed } from "@/core/utils/reactive/signal";
import { CountBadge } from "@/core/ui/components/count_badge/count_badge";
import { Icon } from "@/core/ui/components/icon/icon";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { h } from "@/core/ui/h/h";

export interface CountToggleButtonProps {
  icon: Icon;
  label: string;
  pressed: Readable<boolean>;
  count: Readable<number>;
  onClick: () => void;
}

export function CountToggleButton({ icon, label, pressed, count, onClick }: CountToggleButtonProps): HTMLElement {
  return (
    <IconButton icon={icon} label={label} pressed={pressed} onClick={onClick}>
      <CountBadge count={computed(() => (pressed.value ? 0 : count.value))} />
    </IconButton>
  );
}
