import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const CountBadgeClass = {
  root: "fsg-CountBadge"
} as const;

type CountBadgeSize = "medium" | "large";

export interface CountBadgeProps {
  count: Readable<number>;
  size?: CountBadgeSize;
}

export function CountBadge({ count, size: countBadgeSize = "medium" }: CountBadgeProps): HTMLElement {
  return (
    <span className={CountBadgeClass.root} data-size={countBadgeSize} hidden={computed(() => count.value === 0)}>
      {computed(() => String(count.value))}
    </span>
  );
}
