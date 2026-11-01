import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Tab } from "@/core/ui/components/tabs/tab";
import { TabManager } from "@/core/ui/components/tabs/tab_manager";
import { h } from "@/core/ui/h/h";

export const TabPanelClass = {
  root: "fsg-TabPanel"
} as const;

export interface TabPanelProps<T> {
  tabManager: Pick<TabManager<T>, "tabs" | "activeTabId">;
  renderPanel: (tab: Tab<T>) => HTMLElement;
}

export function TabPanel<T>({ tabManager, renderPanel }: TabPanelProps<T>): HTMLElement {
  const createPanelScope = captureScope();
  const activeTab = computed(() => tabManager.tabs.value.find(tab => tab.id === tabManager.activeTabId.value) ?? null);
  const panel = <div className={TabPanelClass.root} role="tabpanel" />;
  let shown: Scoped<HTMLElement> | null = null;

  effect(() => {
    const tab = activeTab.value;

    shown?.dispose();
    shown = tab === null ? null : createPanelScope(() => untracked(() => renderPanel(tab)));
    panel.replaceChildren(...shown === null ? [] : [shown.result]);
  });
  onCleanup(() => shown?.dispose());
  return panel;
}
