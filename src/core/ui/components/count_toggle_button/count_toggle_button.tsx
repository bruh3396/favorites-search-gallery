import { CountBadge, CountBadgeProps } from "@/core/ui/components/count_badge/count_badge";
import { IconButton, IconButtonProps } from "@/core/ui/components/icon_button/icon_button";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Icon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export interface CountToggleButtonProps {
  icon: Icon;
  label: string;
  title?: IconButtonProps["title"];
  size?: CountBadgeProps["size"];
  pressed: Readable<boolean>;
  count: Readable<number>;
  onClick: () => void;
}

export function CountToggleButton({ icon, label, title, size, pressed, count, onClick }: CountToggleButtonProps): HTMLElement {
  return (
    <IconButton icon={icon} label={label} title={title} size={size} pressed={pressed} onClick={onClick}>
      <CountBadge count={computed(() => (pressed.value ? 0 : count.value))} size={size} />
    </IconButton>
  );
}
