import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { KeyedList } from "@/core/ui/h/keyed_list";
import { h } from "@/core/ui/h/h";

export const TabStripClass = {
  root: "fsg-TabStrip",
  list: "fsg-TabStrip-list",
  tab: "fsg-TabStrip-tab",
  select: "fsg-TabStrip-select",
  label: "fsg-TabStrip-label",
  detail: "fsg-TabStrip-detail",
  close: "fsg-TabStrip-close",
  add: "fsg-TabStrip-add"
} as const;

export interface TabStripItem {
  readonly id: string;
  readonly label: Readable<string>;
  readonly detail?: Readable<string>;
  readonly closable: boolean;
}

export interface TabStripProps {
  tabs: Readable<readonly TabStripItem[]>;
  activeId: Readable<string | null>;
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

export function TabStrip({ tabs, activeId, onActivate, onClose, onAdd }: TabStripProps): HTMLElement {
  const items = new KeyedList<TabStripItem>({
    getKey: tab => tab.id,
    create: tab => <Tab tab={tab} activeId={activeId} onActivate={onActivate} onClose={onClose} />
  });
  const list = <div className={TabStripClass.list} role="tablist" />;

  effect(() => list.replaceChildren(...items.reconcile(tabs.value)));
  return (
    <div className={TabStripClass.root}>
      {list}
      <button className={TabStripClass.add} type="button" aria-label="New tab" onClick={onAdd}>+</button>
    </div>
  );
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
        {tab.detail && <span className={TabStripClass.detail}>{tab.detail}</span>}
      </button>
      {tab.closable && (
        <button className={TabStripClass.close} type="button" aria-label={computed(() => `Close ${tab.label.value}`)} onClick={() => onClose(tab.id)}>
          ✕
        </button>
      )}
    </div>
  );
}
