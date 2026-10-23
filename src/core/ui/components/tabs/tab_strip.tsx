import { Child, h } from "@/core/ui/h/h";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { KeyedList } from "@/core/ui/h/keyed_list";
import { createIcon } from "@/core/ui/components/icon/icon";

export const TabStripClass = {
  root: "fsg-TabStrip",
  list: "fsg-TabStrip-list",
  tab: "fsg-TabStrip-tab",
  select: "fsg-TabStrip-select",
  label: "fsg-TabStrip-label",
  close: "fsg-TabStrip-close",
  add: "fsg-TabStrip-add",
  icon: "fsg-TabStrip-icon",
  trailing: "fsg-TabStrip-trailing"
} as const;

export interface TabStripItem {
  readonly id: string;
  readonly label: Readable<string>;
  readonly closable: boolean;
}

export interface TabStripProps {
  tabs: Readable<readonly TabStripItem[]>;
  activeId: Readable<string | null>;
  trailing?: Child;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
}

interface TabProps {
  tab: TabStripItem;
  activeId: Readable<string | null>;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}

const MIDDLE_BUTTON = 1;

export function TabStrip({ tabs, activeId, trailing, onActivate, onClose, onAdd }: TabStripProps): HTMLElement {
  let isRendered = false;
  const items = new KeyedList<TabStripItem>({
    getKey: (tab): string => tab.id,
    create: (tab): HTMLElement => {
      const element = <Tab tab={tab} activeId={activeId} onActivate={onActivate} onClose={onClose} />;

      if (isRendered) {
        markEntering(element);
      }
      return element;
    }
  });
  const list = <div className={TabStripClass.list} role="tablist" />;

  effect(() => list.replaceChildren(...items.reconcile(tabs.value)));
  isRendered = true;
  return (
    <div className={TabStripClass.root}>
      {list}
      <button className={TabStripClass.add} type="button" aria-label="New tab" onClick={onAdd}>
        {createIcon("add", TabStripClass.icon)}
      </button>
      {trailing && <div className={TabStripClass.trailing}>{trailing}</div>}
    </div>
  );
}

function markEntering(element: HTMLElement): void {
  element.dataset.entering = "";
  element.addEventListener("animationend", () => delete element.dataset.entering, { once: true });
}

function Tab({ tab, activeId, onActivate, onClose }: TabProps): HTMLElement {
  return (
    <div className={TabStripClass.tab} role="presentation">
      <button
        className={TabStripClass.select}
        type="button"
        role="tab"
        aria-selected={computed(() => String(activeId.value === tab.id))}
        onClick={() => onActivate(tab.id)}
        onAuxclick={event => {
          if (event.button === MIDDLE_BUTTON && tab.closable) {
            onClose(tab.id);
          }
        }}
      >
        <span className={TabStripClass.label}>{tab.label}</span>
      </button>
      {tab.closable && (
        <button className={TabStripClass.close} type="button" aria-label={computed(() => `Close ${tab.label.value}`)} onClick={() => onClose(tab.id)}>
          {createIcon("close", TabStripClass.icon)}
        </button>
      )}
    </div>
  );
}
