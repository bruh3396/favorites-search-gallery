import { Readable, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { Icon } from "@/core/ui/components/icon/icon";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { h } from "@/core/ui/h/h";

export const ActivityBarClass = {
  root: "fsg-ActivityBar",
  rail: "fsg-ActivityBar-rail",
  item: "fsg-ActivityBar-item",
  view: "fsg-ActivityBar-view"
} as const;

export interface ActivityBarItem {
  readonly id: string;
  readonly label: string;
  readonly icon: Icon;
}

export interface ActivityBarProps {
  items: readonly ActivityBarItem[];
  value: Readable<string | null>;
  renderView: (activityBarItem: ActivityBarItem) => HTMLElement;
  onValueChange: (id: string | null) => void;
}

export function ActivityBar({ items: activityBarItems, value, renderView, onValueChange }: ActivityBarProps): HTMLElement {
  const createViewScope = captureScope();
  const activeItem = computed(() => activityBarItems.find(activityBarItem => activityBarItem.id === value.value) ?? null);
  const view = (
    <div
      className={ActivityBarClass.view}
      role="region"
      aria-label={computed(() => activeItem.value?.label ?? "")}
      hidden={computed(() => activeItem.value === null)}
    />
  );
  let shown: Scoped<HTMLElement> | null = null;
  let shownActivityBarItem: ActivityBarItem | null = null;

  effect(() => {
    const activityBarItem = activeItem.value;

    if (activityBarItem === null || activityBarItem === shownActivityBarItem) {
      return;
    }
    shown?.dispose();
    shown = createViewScope(() => untracked(() => renderView(activityBarItem)));
    shownActivityBarItem = activityBarItem;
    view.replaceChildren(shown.result);
  });
  onCleanup(() => shown?.dispose());

  const buttons = activityBarItems.map(activityBarItem => {
    const button = (
      <IconButton
        className={ActivityBarClass.item}
        icon={activityBarItem.icon}
        label={activityBarItem.label}
        size="large"
        pressed={computed(() => value.value === activityBarItem.id)}
        onClick={() => onValueChange(value.peek() === activityBarItem.id ? null : activityBarItem.id)}
      />
    );

    button.ariaControlsElements = [view];
    return button;
  });
  return (
    <div className={ActivityBarClass.root}>
      <nav className={ActivityBarClass.rail} aria-label="Activities">{buttons}</nav>
      {view}
    </div>
  );
}
