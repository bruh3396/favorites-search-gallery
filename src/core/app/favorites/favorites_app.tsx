import { ActivityBar, ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";
import { Child, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";
import APP_CSS from "@/core/app/favorites/favorites_app.css?inline";
import { AppPreferences } from "@/core/app/app_preferences";
import COPY_ID_BUTTON_CSS from "@/core/app/favorites/lightbox/copy_id_button.css?inline";
import FAVORITES_SEARCH_SETTINGS_ROW_CSS from "@/core/app/favorites/search_settings/favorites_search_settings_row.css?inline";
import { FAVORITES_SETTINGS_TOOL } from "@/core/app/favorites/settings/favorites_settings_tool";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { KeyCap } from "@/core/ui/components/key_cap/key_cap";
import LIGHTBOX_CSS from "@/core/features/lightbox/styles.css?inline";
import LIGHTBOX_DETAILS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_details.css?inline";
import LIGHTBOX_TAGS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_tags.css?inline";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import SEARCH_PANEL_CSS from "@/core/app/favorites/search_panel/favorites_search_panel.css?inline";
import { TabPanel } from "@/core/ui/components/tabs/tab_panel";
import UI_CSS from "@/core/ui/styles.css?inline";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { measureFavoritesLoadProgress } from "@/core/app/favorites/favorites_load_progress_measurer";

export const FAVORITES_APP_STYLES = [
  UI_CSS,
  APP_CSS,
  SEARCH_PANEL_CSS,
  FAVORITES_SEARCH_SETTINGS_ROW_CSS,
  LIGHTBOX_CSS,
  LIGHTBOX_DETAILS_CSS,
  LIGHTBOX_TAGS_CSS,
  COPY_ID_BUTTON_CSS
];

export const FavoritesAppClass = {
  root: "fsg-FavoritesApp",
  loadLine: "fsg-FavoritesApp-loadLine",
  panes: "fsg-FavoritesApp-panes",
  tabs: "fsg-FavoritesApp-tabs",
  zenHint: "fsg-FavoritesApp-zenHint"
} as const;

const TOOLS: readonly ActivityBarItem[] = [FAVORITES_SETTINGS_TOOL];

export interface FavoritesAppProps {
  favoritesService: Pick<FavoritesService, "loadState">;
  favoritesWorkspace: Pick<FavoritesWorkspace, "tabManager">;
  lightboxView: HTMLElement;
  favoritesPreferences: Pick<AppPreferences["favorites"], "activeTool">;
  tabsHeaderChild: Child;
  zenEnabled: Readable<boolean>;
  resetSettings: () => void;
  renderTool: (activityBarItem: ActivityBarItem) => HTMLElement;
  renderPanel: (favoritesTab: FavoritesTab) => HTMLElement;
}

export function FavoritesApp({
  favoritesService, favoritesWorkspace, lightboxView, favoritesPreferences, tabsHeaderChild, zenEnabled, resetSettings, renderTool, renderPanel
}: FavoritesAppProps): HTMLElement[] {
  return [
    <div className={FavoritesAppClass.root} data-zen={computed(() => (zenEnabled.value ? "" : null))}>
      <div className={FavoritesAppClass.loadLine}>
        <ProgressLine label="Loading Favorites" progress={computed(() => measureFavoritesLoadProgress(favoritesService.loadState.value))} />
      </div>
      <main className={FavoritesAppClass.panes}>
        <ActivityBar
          items={TOOLS}
          value={favoritesPreferences.activeTool}
          renderView={activityBarItem => (
            <ViewPane
              title={activityBarItem.label}
              actions={[{ label: "Reset All Settings", icon: "reset", onClick: resetSettings }]}
            >
              {renderTool(activityBarItem)}
            </ViewPane>
          )}
          onValueChange={id => favoritesPreferences.activeTool.set(id)}
        />
        <div className={FavoritesAppClass.tabs}>
          {tabsHeaderChild}
          <TabPanel<FavoritesTab> tabManager={favoritesWorkspace.tabManager} renderPanel={({ value: favoritesTab }) => renderPanel(favoritesTab)} />
        </div>
      </main>
      <div className={FavoritesAppClass.zenHint} role="status" hidden={computed(() => !zenEnabled.value)} data-zen-stage="">
        Press <KeyCap label="Z" /> or <KeyCap label="Esc" /> to exit Zen
      </div>
    </div>,
    lightboxView
  ];
}
