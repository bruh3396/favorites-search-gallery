import { Readable, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { Tab, TabManager } from "@/core/ui/tabs/tab_manager";
import { TabStrip } from "@/core/ui/components/tab_strip/tab_strip";
import { h } from "@/core/ui/h/h";

export const TabsClass = {
  root: "fsg-Tabs",
  panel: "fsg-Tabs-panel"
} as const;

export interface TabsProps<T> {
  manager: TabManager<T>;
  label: (tab: Tab<T>) => Readable<string>;
  renderPanel: (tab: Tab<T>) => HTMLElement;
  onAdd: () => void;
}

export function Tabs<T>({ manager, label, renderPanel, onAdd }: TabsProps<T>): HTMLElement {
  const createPanelScope = captureScope();
  const activeTab = computed(() => manager.tabs.value.find(tab => tab.id === manager.activeId.value) ?? null);
  const items = computed(() => manager.tabs.value.map(tab => ({ id: tab.id, label: label(tab), closable: tab.closable })));
  const panel = <div className={TabsClass.panel} role="tabpanel" />;
  let shown: Scoped<HTMLElement> | null = null;

  effect(() => {
    const tab = activeTab.value;

    shown?.dispose();
    shown = tab === null ? null : createPanelScope(() => untracked(() => renderPanel(tab)));
    panel.replaceChildren(...shown === null ? [] : [shown.result]);
  });
  onCleanup(() => shown?.dispose());
  return (
    <div className={TabsClass.root}>
      <TabStrip
        tabs={items}
        activeId={manager.activeId}
        onActivate={id => manager.activate(id)}
        onClose={id => manager.close(id)}
        onAdd={onAdd}
      />
      {panel}
    </div>
  );
}
