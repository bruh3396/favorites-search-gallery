import { Child, h } from "@/core/ui/h/h";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { ContextMenu } from "@/core/ui/components/context_menu/context_menu";
import { ContextMenuItem } from "@/core/ui/components/context_menu/context_menu_item";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { KeyedList } from "@/core/ui/h/keyed_list";

export const TabStripClass = {
  root: "fsg-TabStrip",
  list: "fsg-TabStrip-list",
  tab: "fsg-TabStrip-tab",
  select: "fsg-TabStrip-select",
  label: "fsg-TabStrip-label",
  close: "fsg-TabStrip-close",
  add: "fsg-TabStrip-add",
  trailing: "fsg-TabStrip-trailing"
} as const;

interface TabStripItem {
  readonly id: string;
  readonly label: Readable<string>;
  readonly closable: boolean;
}

export interface TabStripProps {
  tabs: Readable<readonly TabStripItem[]>;
  activeTabId: Readable<string | null>;
  trailingChild?: Child;
  onActivate: (tabId: string) => void;
  onDuplicate: (tabId: string) => void;
  onClose: (tabIds: readonly string[]) => void;
  onMove: (tabId: string, index: number) => void;
  onAdd: () => void;
}

type DropSide = "before" | "after";

interface TabProps {
  stripItem: TabStripItem;
  activeTabId: Readable<string | null>;
  onActivate: (tabId: string) => void;
  onClose: (tabIds: readonly string[]) => void;
  onDrop: (draggedTabId: string, dropSide: DropSide) => void;
}

const MIDDLE_BUTTON = 1;
const TAB_DRAG_TYPE = "application/x-fsg-tab";

export function TabStrip({ tabs, activeTabId, trailingChild, onActivate, onDuplicate, onClose, onMove, onAdd }: TabStripProps): HTMLElement {
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
  const list = (
    <div
      className={TabStripClass.list}
      role="tablist"
      onWheel={event => {
        if (event.deltaX === 0 && event.deltaY !== 0) {
          event.preventDefault();
          list.scrollLeft += event.deltaY;
        }
      }}
    />
  );

  effect(() => {
    const tabStripItems = tabs.value;

    list.replaceChildren(...items.reconcile(tabStripItems));
    const activeTab = list.children[tabStripItems.findIndex(tabStripItem => tabStripItem.id === activeTabId.value)];

    if (activeTab !== undefined) {
      scrollIntoList(list, activeTab);
    }
  });
  isRendered = true;
  return (
    <ContextMenu
      target={
        <div className={TabStripClass.root}>
          {list}
          <IconButton className={TabStripClass.add} icon="add" label="New Tab" size="small" onClick={onAdd} />
          <div className={TabStripClass.trailing}>{trailingChild}</div>
        </div>
      }
      listItems={event => listTabMenuItems(tabs.peek(), readTabId(event), { onDuplicate, onClose })}
    />
  );
}

function readTabId(event: MouseEvent): string | undefined {
  for (const eventTarget of event.composedPath()) {
    if (eventTarget instanceof HTMLElement && eventTarget.dataset.tabId !== undefined) {
      return eventTarget.dataset.tabId;
    }
  }
  return undefined;
}

function listTabMenuItems(
  tabStripItems: readonly TabStripItem[],
  tabId: string | undefined,
  { onDuplicate, onClose }: Pick<TabStripProps, "onDuplicate" | "onClose">
): readonly ContextMenuItem[] {
  const index = tabStripItems.findIndex(tabStripItem => tabStripItem.id === tabId);

  if (index === -1) {
    return [];
  }
  const tabStripItem = tabStripItems[index];
  const otherTabIds = listClosableTabIds(tabStripItems.filter(otherTabStripItem => otherTabStripItem !== tabStripItem));
  const rightTabIds = listClosableTabIds(tabStripItems.slice(index + 1));
  const allTabIds = listClosableTabIds(tabStripItems);
  return [
    { label: "Duplicate", onChoose: () => onDuplicate(tabStripItem.id) },
    { label: "Close", disabled: !tabStripItem.closable, startsGroup: true, onChoose: () => onClose([tabStripItem.id]) },
    { label: "Close Other Tabs", disabled: otherTabIds.length === 0, startsGroup: true, onChoose: () => onClose(otherTabIds) },
    { label: "Close Tabs to the Right", disabled: rightTabIds.length === 0, onChoose: () => onClose(rightTabIds) },
    { label: "Close All Tabs", disabled: allTabIds.length === 0, onChoose: () => onClose(allTabIds) }
  ];
}

function listClosableTabIds(tabStripItems: readonly TabStripItem[]): string[] {
  return tabStripItems.filter(tabStripItem => tabStripItem.closable).map(tabStripItem => tabStripItem.id);
}

function markEntering(element: HTMLElement): void {
  element.dataset.entering = "";
  element.addEventListener("animationend", () => delete element.dataset.entering, { once: true });
}

function scrollIntoList(list: HTMLElement, tab: Element): void {
  const listBounds = list.getBoundingClientRect();
  const tabBounds = tab.getBoundingClientRect();

  if (tabBounds.left < listBounds.left) {
    list.scrollLeft -= listBounds.left - tabBounds.left;
  } else if (tabBounds.right > listBounds.right) {
    list.scrollLeft += tabBounds.right - listBounds.right;
  }
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
      dataset={{ tabId: tabStripItem.id }}
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
            onClose([tabStripItem.id]);
          }
        }}
      >
        <span className={TabStripClass.label}>{tabStripItem.label}</span>
      </button>
      {tabStripItem.closable && (
        <IconButton
          className={TabStripClass.close}
          icon="close"
          label={computed(() => `Close ${tabStripItem.label.value}`)}
          size="small"
          onClick={() => onClose([tabStripItem.id])}
        />
      )}
    </div>
  );
  return element;
}
