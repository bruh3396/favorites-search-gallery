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
  activeId: Readable<string | null>;
  trailing?: Child;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onMove: (id: string, index: number) => void;
  onAdd: () => void;
  onCloseAll: () => void;
}

type DropSide = "before" | "after";

interface TabProps {
  tab: TabStripItem;
  activeId: Readable<string | null>;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onDrop: (draggedId: string, side: DropSide) => void;
}

const MIDDLE_BUTTON = 1;
const TAB_DRAG_TYPE = "application/x-fsg-tab";

export function TabStrip({ tabs, activeId, trailing, onActivate, onClose, onMove, onAdd, onCloseAll }: TabStripProps): HTMLElement {
  let isRendered = false;
  const moveNextTo = (targetId: string, draggedId: string, side: DropSide): void => {
    if (draggedId === targetId) {
      return;
    }
    const ids = tabs.peek().map(tab => tab.id).filter(id => id !== draggedId);

    onMove(draggedId, ids.indexOf(targetId) + (side === "after" ? 1 : 0));
  };
  const items = new KeyedList<TabStripItem>({
    getKey: (tab): string => tab.id,
    create: (tab): HTMLElement => {
      const element = (
        <Tab
          tab={tab}
          activeId={activeId}
          onActivate={onActivate}
          onClose={onClose}
          onDrop={(draggedId, side) => moveNextTo(tab.id, draggedId, side)}
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
        {trailing}
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

function Tab({ tab, activeId, onActivate, onClose, onDrop }: TabProps): HTMLElement {
  const element = (
    <div
      className={TabStripClass.tab}
      role="presentation"
      draggable={true}
      onDragstart={event => {
        event.dataTransfer?.setData(TAB_DRAG_TYPE, tab.id);
        event.dataTransfer?.setData("text/plain", tab.label.peek());
      }}
      onDragover={event => {
        if (event.dataTransfer?.types.includes(TAB_DRAG_TYPE) === true) {
          event.preventDefault();
          element.dataset.drop = readDropSide(event, element);
        }
      }}
      onDragleave={() => delete element.dataset.drop}
      onDrop={event => {
        const draggedId = event.dataTransfer?.getData(TAB_DRAG_TYPE) ?? "";

        delete element.dataset.drop;

        if (draggedId !== "") {
          event.preventDefault();
          onDrop(draggedId, readDropSide(event, element));
        }
      }}
    >
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
  return element;
}
