import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const CountBadgeClass = {
  root: "fsg-CountBadge"
} as const;

export interface CountBadgeProps {
  count: Readable<number>;
}

export function CountBadge({ count }: CountBadgeProps): HTMLElement {
  return (
    <span className={CountBadgeClass.root} hidden={computed(() => count.value === 0)}>
      {computed(() => String(count.value))}
    </span>
  );
}
