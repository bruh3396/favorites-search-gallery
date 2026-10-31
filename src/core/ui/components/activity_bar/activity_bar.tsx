import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { Readable, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { h } from "@/core/ui/h/h";

export const ActivityBarClass = {
  root: "fsg-ActivityBar",
  rail: "fsg-ActivityBar-rail",
  item: "fsg-ActivityBar-item",
  icon: "fsg-ActivityBar-icon",
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
      <button
        className={ActivityBarClass.item}
        type="button"
        aria-label={activityBarItem.label}
        title={activityBarItem.label}
        aria-pressed={computed(() => String(value.value === activityBarItem.id))}
        onClick={() => onValueChange(value.peek() === activityBarItem.id ? null : activityBarItem.id)}
      >
        {createIcon(activityBarItem.icon, ActivityBarClass.icon)}
      </button>
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
