import { Readable, computed } from "@/core/utils/reactive/signal";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { h } from "@/core/ui/h/h";

export const TabStripToggleClass = {
  badge: "fsg-TabStripToggle-badge"
} as const;

export interface TabStripToggleProps {
  visible: StoredValue<boolean>;
  tabCount: Readable<number>;
}

export function TabStripToggle({ visible, tabCount }: TabStripToggleProps): HTMLElement {
  const hiddenTabCount = computed(() => (visible.value ? 0 : tabCount.value));
  return (
    <IconButton
      icon="appWindow"
      label={computed(() => (hiddenTabCount.value > 1 ? `Show tabs (${hiddenTabCount.value} open)` : "Show tabs"))}
      pressed={visible}
      onClick={() => visible.set(!visible.peek())}
    >
      <span className={TabStripToggleClass.badge} hidden={computed(() => hiddenTabCount.value < 2)}>
        {computed(() => String(hiddenTabCount.value))}
      </span>
    </IconButton>
  );
}
