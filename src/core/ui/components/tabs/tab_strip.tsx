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
  closeAll: "fsg-TabStrip-closeAll",
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
  activeTabId: Readable<string | null>;
  trailingChild?: Child;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onMove: (tabId: string, index: number) => void;
  onAdd: () => void;
  onCloseAll: () => void;
}

type DropSide = "before" | "after";

interface TabProps {
  stripItem: TabStripItem;
  activeTabId: Readable<string | null>;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onDrop: (draggedTabId: string, dropSide: DropSide) => void;
}

const MIDDLE_BUTTON = 1;
const TAB_DRAG_TYPE = "application/x-fsg-tab";

export function TabStrip({ tabs, activeTabId, trailingChild, onActivate, onClose, onMove, onAdd, onCloseAll }: TabStripProps): HTMLElement {
  let isRendered = false;
  const moveNextTo = (targetTabId: string, draggedTabId: string, dropSide: DropSide): void => {
    if (draggedTabId === targetTabId) {
      return;
    }
    const tabIds = tabs.peek().map(tabStripItem => tabStripItem.id).filter(tabId => tabId !== draggedTabId);

    onMove(draggedTabId, tabIds.indexOf(targetTabId) + (dropSide === "after" ? 1 : 0));
  };
  const items = new KeyedList<TabStripItem>({
    getKey: (tabStripItem): string => tabStripItem.id,
    create: (tabStripItem): HTMLElement => {
      const element = (
        <Tab
          stripItem={tabStripItem}
          activeTabId={activeTabId}
          onActivate={onActivate}
          onClose={onClose}
          onDrop={(draggedTabId, dropSide) => moveNextTo(tabStripItem.id, draggedTabId, dropSide)}
        />
      );

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
      <div className={TabStripClass.trailing}>
        {trailingChild}
        <button className={TabStripClass.closeAll} type="button" aria-label="Close all tabs" onClick={onCloseAll}>
          {createIcon("ban", TabStripClass.icon)}
        </button>
      </div>
    </div>
  );
}

function markEntering(element: HTMLElement): void {
  element.dataset.entering = "";
  element.addEventListener("animationend", () => delete element.dataset.entering, { once: true });
}

function readDropSide(event: DragEvent, element: HTMLElement): DropSide {
  const { left, width } = element.getBoundingClientRect();
  return event.clientX < left + (width / 2) ? "before" : "after";
}

function Tab({ stripItem: tabStripItem, activeTabId, onActivate, onClose, onDrop }: TabProps): HTMLElement {
  const element = (
    <div
      className={TabStripClass.tab}
      role="presentation"
      draggable={true}
      onDragstart={event => {
        event.dataTransfer?.setData(TAB_DRAG_TYPE, tabStripItem.id);
        event.dataTransfer?.setData("text/plain", tabStripItem.label.peek());
      }}
      onDragover={event => {
        if (event.dataTransfer?.types.includes(TAB_DRAG_TYPE) === true) {
          event.preventDefault();
          element.dataset.drop = readDropSide(event, element);
        }
      }}
      onDragleave={() => delete element.dataset.drop}
      onDrop={event => {
        const draggedTabId = event.dataTransfer?.getData(TAB_DRAG_TYPE) ?? "";

        delete element.dataset.drop;

        if (draggedTabId !== "") {
          event.preventDefault();
          onDrop(draggedTabId, readDropSide(event, element));
        }
      }}
    >
      <button
        className={TabStripClass.select}
        type="button"
        role="tab"
        aria-selected={computed(() => String(activeTabId.value === tabStripItem.id))}
        onClick={() => onActivate(tabStripItem.id)}
        onAuxclick={event => {
          if (event.button === MIDDLE_BUTTON && tabStripItem.closable) {
            onClose(tabStripItem.id);
          }
        }}
      >
        <span className={TabStripClass.label}>{tabStripItem.label}</span>
      </button>
      {tabStripItem.closable && (
        <button
          className={TabStripClass.close}
          type="button"
          aria-label={computed(() => `Close ${tabStripItem.label.value}`)}
          onClick={() => onClose(tabStripItem.id)}
        >
          {createIcon("close", TabStripClass.icon)}
        </button>
      )}
    </div>
  );
  return element;
}
