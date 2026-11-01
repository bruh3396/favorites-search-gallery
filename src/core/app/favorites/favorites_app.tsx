import { ActivityBar, ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import APP_CSS from "@/core/app/favorites/favorites_app.css?inline";
import { AppPreferences } from "@/core/app/app_preferences";
import COPY_ID_BUTTON_CSS from "@/core/app/favorites/lightbox/copy_id_button.css?inline";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import LIGHTBOX_CSS from "@/core/features/lightbox/styles.css?inline";
import LIGHTBOX_DETAILS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_details.css?inline";
import LIGHTBOX_TAGS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_tags.css?inline";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import SEARCH_PANEL_CSS from "@/core/app/favorites/search_panel/favorites_search_panel.css?inline";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import TAB_STRIP_TOGGLE_CSS from "@/core/app/favorites/search_panel/tab_strip_toggle.css?inline";
import { Tabs } from "@/core/ui/components/tabs/tabs";
import UI_CSS from "@/core/ui/styles.css?inline";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { doNothing } from "@/core/utils/function/function_utilities";
import { h } from "@/core/ui/h/h";
import { measureFavoritesLoadProgress } from "@/core/app/favorites/favorites_load_progress_measurer";

export const FAVORITES_APP_STYLES = [
  UI_CSS,
  APP_CSS,
  SEARCH_PANEL_CSS,
  TAB_STRIP_TOGGLE_CSS,
  LIGHTBOX_CSS,
  LIGHTBOX_DETAILS_CSS,
  LIGHTBOX_TAGS_CSS,
  COPY_ID_BUTTON_CSS
];

export const FavoritesAppClass = {
  root: "fsg-FavoritesApp",
  loadLine: "fsg-FavoritesApp-loadLine",
  panes: "fsg-FavoritesApp-panes",
  zenHint: "fsg-FavoritesApp-zenHint"
} as const;

const TOOLS: readonly ActivityBarItem[] = [{ id: "settings", label: "Settings", icon: "settings"}];

export interface FavoritesAppProps {
  favoritesService: Pick<FavoritesService, "loadState" | "loadStatus">;
  favoritesWorkspace: FavoritesWorkspace;
  lightboxView: HTMLElement;
  favoritesPreferences: Pick<AppPreferences["favorites"], "activeTool" | "tabStripVisible">;
  zenEnabled: Readable<boolean>;
  renderTool: (activityBarItem: ActivityBarItem) => HTMLElement;
  renderPanel: (favoritesTab: FavoritesTab) => HTMLElement;
}

export function FavoritesApp({
  favoritesService, favoritesWorkspace, lightboxView, favoritesPreferences, zenEnabled, renderTool, renderPanel
}: FavoritesAppProps): HTMLElement[] {
  return [
    <div className={FavoritesAppClass.root} data-zen={computed(() => (zenEnabled.value ? "" : null))}>
      <div className={FavoritesAppClass.loadLine}>
        <ProgressLine label="Loading favorites" progress={computed(() => measureFavoritesLoadProgress(favoritesService.loadState.value))} />
      </div>
      <main className={FavoritesAppClass.panes}>
        <ActivityBar
          items={TOOLS}
          value={favoritesPreferences.activeTool}
          renderView={activityBarItem => (
            <ViewPane
              title={activityBarItem.label}
              actions={[{ label: "Reset all settings", icon: "reset", disabled: new Signal(true), onClick: doNothing }]}
            >
              {renderTool(activityBarItem)}
            </ViewPane>
          )}
          onValueChange={id => favoritesPreferences.activeTool.set(id)}
        />
        <Tabs<FavoritesTab>
          tabManager={favoritesWorkspace.tabManager}
          label={({ value: favoritesTab }) => favoritesTab.title}
          renderPanel={({ value: favoritesTab }) => renderPanel(favoritesTab)}
          stripVisible={favoritesPreferences.tabStripVisible}
          trailingChild={<StatusText text={favoritesService.loadStatus} />}
          onAdd={() => favoritesWorkspace.openBlankTab()}
          onClose={tabId => favoritesWorkspace.closeTab(tabId)}
          onCloseAll={() => favoritesWorkspace.closeAllTabs()}
        />
      </main>
      <div className={FavoritesAppClass.zenHint} role="status" hidden={computed(() => !zenEnabled.value)} data-zen-stage="">
        Press Z or Esc to exit Zen
      </div>
    </div>,
    lightboxView
  ];
}
