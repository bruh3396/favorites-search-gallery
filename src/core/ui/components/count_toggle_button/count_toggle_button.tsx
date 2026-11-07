import { Reactive, h } from "@/core/ui/h/h";
import { CountBadge } from "@/core/ui/components/count_badge/count_badge";
import { Icon } from "@/core/ui/components/icon/icon";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { Readable } from "@/core/utils/reactive/signal";

export interface CountToggleButtonProps {
  icon: Icon;
  label: Reactive<string>;
  pressed: Readable<boolean>;
  count: Readable<number>;
  onClick: () => void;
}

export function CountToggleButton({ icon, label, pressed, count, onClick }: CountToggleButtonProps): HTMLElement {
  return (
    <IconButton icon={icon} label={label} pressed={pressed} onClick={onClick}>
      <CountBadge count={count} />
    </IconButton>
  );
}
