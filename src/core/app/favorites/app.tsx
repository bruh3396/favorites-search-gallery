import { ActivityBar, ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";
import { FAVORITES_SETTINGS_LAYOUT, createFavoritesSettings } from "@/core/app/favorites/settings";
import { FAVORITES_STYLES, FavoritesService } from "@/core/features/favorites/favorites";
import { FavoritesSearchPanel, FavoritesSearchPanelProps } from "@/core/app/favorites/panel/search";
import { LIGHTBOX_STYLES, Lightbox } from "@/core/features/lightbox/lightbox";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesPreferences } from "@/core/app/preferences";
import { FavoritesShell } from "@/core/app/favorites/shell/shell";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/workspace";
import SEARCH_PANEL_CSS from "@/core/app/favorites/panel/search.css?inline";
import SHELL_CSS from "@/core/app/favorites/shell/shell.css?inline";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SettingsScreen } from "@/core/ui/settings/screen";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { Tabs } from "@/core/ui/components/tabs/tabs";
import UI_CSS from "@/core/ui/styles.css?inline";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { h } from "@/core/ui/h/h";

export const FAVORITES_APP_STYLES = [UI_CSS, FAVORITES_STYLES, SHELL_CSS, SEARCH_PANEL_CSS, LIGHTBOX_STYLES];

const TOOLS: readonly ActivityBarItem[] = [{ id: "settings", label: "Settings", icon: "settings" }];

export interface FavoritesAppProps {
  favorites: FavoritesService;
  workspace: FavoritesWorkspace;
  lightbox: Lightbox<Favorite>;
  preferences: FavoritesPreferences;
  scheduler: Scheduler;
  panel: (tab: FavoritesTab) => FavoritesSearchPanelProps;
}

export function FavoritesApp({ favorites, workspace, lightbox, preferences, scheduler, panel }: FavoritesAppProps): HTMLElement[] {
  return [
    <FavoritesShell
      favorites={favorites}
      panes={[
        <ActivityBar
          items={TOOLS}
          value={preferences.activeTool}
          renderPanel={tool => (
            <ViewPane title={tool.label}>
              <SettingsScreen
                layout={FAVORITES_SETTINGS_LAYOUT}
                descriptors={createFavoritesSettings(preferences)}
                expanded={preferences.expandedSettingSections}
                size="small"
                scheduler={scheduler}
              />
            </ViewPane>
          )}
          onValueChange={id => preferences.activeTool.set(id)}
        />,
        <Tabs<FavoritesTab>
          manager={workspace.tabManager}
          label={({ value }) => value.title}
          renderPanel={({ value }) => <FavoritesSearchPanel {...panel(value)} />}
          stripVisible={preferences.tabStripVisible}
          trailing={<StatusText text={favorites.loadStatus} />}
          onAdd={() => workspace.openBlankTab()}
          onClose={id => workspace.closeTab(id)}
          onCloseAll={() => workspace.closeAllTabs()}
        />
      ]}
    />,
    lightbox.createView()
  ];
}
