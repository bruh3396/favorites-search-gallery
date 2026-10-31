import { Child, h } from "@/core/ui/h/h";
import { Readable, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { Tab } from "@/core/ui/tabs/tab";
import { TabManager } from "@/core/ui/tabs/tab_manager";
import { TabStrip } from "@/core/ui/components/tabs/tab_strip";

export const TabsClass = {
  root: "fsg-Tabs",
  panel: "fsg-Tabs-panel"
} as const;

export interface TabsProps<T> {
  tabManager: TabManager<T>;
  label: (tab: Tab<T>) => Readable<string>;
  renderPanel: (tab: Tab<T>) => HTMLElement;
  stripVisible: Readable<boolean>;
  trailingChild?: Child;
  onAdd: () => void;
  onClose: (tabId: string) => void;
  onCloseAll: () => void;
}

export function Tabs<T>({ tabManager, label, renderPanel, stripVisible, trailingChild, onAdd, onClose, onCloseAll }: TabsProps<T>): HTMLElement {
  const createPanelScope = captureScope();
  const activeTab = computed(() => tabManager.tabs.value.find(tab => tab.id === tabManager.activeTabId.value) ?? null);
  const items = computed(() => tabManager.tabs.value.map(tab => ({ id: tab.id, label: label(tab), closable: tab.closable })));
  const panel = <div className={TabsClass.panel} role="tabpanel" />;
  let shown: Scoped<HTMLElement> | null = null;

  effect(() => {
    const tab = activeTab.value;

    shown?.dispose();
    shown = tab === null ? null : createPanelScope(() => untracked(() => renderPanel(tab)));
    panel.replaceChildren(...shown === null ? [] : [shown.result]);
  });
  onCleanup(() => shown?.dispose());
  const strip = (
    <TabStrip
      tabs={items}
      activeTabId={tabManager.activeTabId}
      trailingChild={trailingChild}
      onActivate={tabId => tabManager.activate(tabId)}
      onClose={onClose}
      onMove={(tabId, index) => tabManager.move(tabId, index)}
      onAdd={onAdd}
      onCloseAll={onCloseAll}
    />
  );

  effect(() => {
    strip.hidden = !stripVisible.value;
  });
  return (
    <div className={TabsClass.root}>
      {strip}
      {panel}
    </div>
  );
}
