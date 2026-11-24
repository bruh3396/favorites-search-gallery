import { Child, h } from "@/core/ui/h/h";
import { Readable, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { Icon } from "@/core/ui/components/icon/icon";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";

export const ActivityBarClass = {
  root: "fsg-ActivityBar",
  rail: "fsg-ActivityBar-rail",
  item: "fsg-ActivityBar-item",
  footer: "fsg-ActivityBar-footer",
  view: "fsg-ActivityBar-view"
} as const;

export interface ActivityBarProps<Id extends string> {
  items: Readonly<Record<Id, { readonly label: string; readonly icon: Icon }>>;
  value: Readable<Id | null>;
  renderViewById: Readonly<Record<Id, () => HTMLElement>>;
  onValueChange: (id: Id | null) => void;
  footerChild?: Child;
}

export function ActivityBar<Id extends string>({ items, value, renderViewById, onValueChange, footerChild }: ActivityBarProps<Id>): HTMLElement {
  const createViewScope = captureScope();
  const ids = Object.keys(items) as Id[];
  const activeId = computed(() => ids.find(id => id === value.value) ?? null);
  const view = (
    <div
      className={ActivityBarClass.view}
      role="region"
      aria-label={computed(() => (activeId.value === null ? "" : items[activeId.value].label))}
      hidden={computed(() => activeId.value === null)}
    />
  );
  let shown: Scoped<HTMLElement> | null = null;
  let shownId: Id | null = null;

  effect(() => {
    const id = activeId.value;

    if (id === null || id === shownId) {
      return;
    }
    shown?.dispose();
    shown = createViewScope(() => untracked(() => renderViewById[id]()));
    shownId = id;
    view.replaceChildren(shown.result);
  });
  onCleanup(() => shown?.dispose());

  const buttons = ids.map(id => {
    const button = (
      <IconButton
        className={ActivityBarClass.item}
        icon={items[id].icon}
        label={items[id].label}
        size="large"
        pressed={computed(() => value.value === id)}
        onClick={() => onValueChange(value.peek() === id ? null : id)}
      />
    );

    button.ariaControlsElements = [view];
    return button;
  });
  return (
    <div className={ActivityBarClass.root}>
      <nav className={ActivityBarClass.rail} aria-label="Activities">
        {buttons}
        {footerChild !== undefined && <div className={ActivityBarClass.footer}>{footerChild}</div>}
      </nav>
      {view}
    </div>
  );
}
