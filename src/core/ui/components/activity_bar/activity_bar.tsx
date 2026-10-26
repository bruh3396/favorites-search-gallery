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
  renderView: (item: ActivityBarItem) => HTMLElement;
  onValueChange: (id: string | null) => void;
}

export function ActivityBar({ items, value, renderView, onValueChange }: ActivityBarProps): HTMLElement {
  const createViewScope = captureScope();
  const activeItem = computed(() => items.find(item => item.id === value.value) ?? null);
  const view = (
    <div
      className={ActivityBarClass.view}
      role="region"
      aria-label={computed(() => activeItem.value?.label ?? "")}
      hidden={computed(() => activeItem.value === null)}
    />
  );
  let shown: Scoped<HTMLElement> | null = null;
  let shownItem: ActivityBarItem | null = null;

  effect(() => {
    const item = activeItem.value;

    if (item === null || item === shownItem) {
      return;
    }
    shown?.dispose();
    shown = createViewScope(() => untracked(() => renderView(item)));
    shownItem = item;
    view.replaceChildren(shown.result);
  });
  onCleanup(() => shown?.dispose());

  const buttons = items.map(item => {
    const button = (
      <button
        className={ActivityBarClass.item}
        type="button"
        aria-label={item.label}
        title={item.label}
        aria-pressed={computed(() => String(value.value === item.id))}
        onClick={() => onValueChange(value.peek() === item.id ? null : item.id)}
      >
        {createIcon(item.icon, ActivityBarClass.icon)}
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
