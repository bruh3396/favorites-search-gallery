import { FAVORITES_TOOL_DEFINITIONS, FavoritesTool } from "@/core/app/favorites/favorites_tool";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { ActivityBar } from "@/core/ui/components/activity_bar/activity_bar";
import { AppMark } from "@/core/ui/app_mark/app_mark";
import { AppPreferences } from "@/core/app/storage/app_preferences";
import { CountToggleButton } from "@/core/ui/components/count_toggle_button/count_toggle_button";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { TabManager } from "@/core/ui/components/tabs/tab_manager";
import { formatCommandTitle } from "@/core/ui/key_bindings/command_title_formatter";
import { h } from "@/core/ui/h/h";

export interface FavoritesActivityBarConfiguration {
  readonly scriptVersion: string;
}

export interface FavoritesActivityBarDependencies {
  favoritesPreferences: Pick<AppPreferences["favorites"], "activeTool">;
  favoritesTabStripVisible: StoredValue<boolean>;
  tabManager: Pick<TabManager<unknown>, "tabs">;
  keyBindings: Readable<Pick<KeyBindings<FavoritesCommand>, "toggleTabs" | "toggleZen">>;
  renderViewByTool: Readonly<Record<FavoritesTool, () => HTMLElement>>;
  enterZen: () => void;
}

export function composeFavoritesActivityBar(
  configuration: FavoritesActivityBarConfiguration,
  dependencies: FavoritesActivityBarDependencies
): HTMLElement {
  const { favoritesPreferences, favoritesTabStripVisible, tabManager, keyBindings, renderViewByTool, enterZen } = dependencies;
  const hiddenTabCount = computed(() => {
    const tabCount = tabManager.tabs.value.length;
    return !favoritesTabStripVisible.value && tabCount > 1 ? tabCount : 0;
  });
  return h(ActivityBar<FavoritesTool>, {
    items: FAVORITES_TOOL_DEFINITIONS,
    renderViewById: renderViewByTool,
    value: favoritesPreferences.activeTool,
    onValueChange: id => favoritesPreferences.activeTool.set(id),
    footerChild: [
      h(CountToggleButton, {
        icon: "appWindow",
        label: "Tabs",
        title: computed(() => formatCommandTitle("Tabs", keyBindings.value.toggleTabs)),
        size: "large",
        pressed: favoritesTabStripVisible,
        count: hiddenTabCount,
        onClick: () => favoritesTabStripVisible.set(!favoritesTabStripVisible.peek())
      }),
      h(IconButton, {
        icon: "leaf",
        label: "Zen",
        title: computed(() => formatCommandTitle("Zen", keyBindings.value.toggleZen)),
        size: "large",
        onClick: enterZen
      }),
      h(AppMark, { scriptVersion: configuration.scriptVersion })
    ]
  });
}
