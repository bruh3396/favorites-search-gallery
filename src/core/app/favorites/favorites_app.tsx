import { ActivityBar, ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";
import FAVORITES_CSS from "@/core/features/favorites/styles.css?inline";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import APP_CSS from "@/core/app/favorites/favorites_app.css?inline";
import COPY_ID_BUTTON_CSS from "@/core/app/favorites/lightbox/copy_id_button.css?inline";
import { AppPreferences } from "@/core/app/app_storage_schema";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import LIGHTBOX_DETAILS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_details.css?inline";
import LIGHTBOX_TAGS_CSS from "@/core/app/favorites/lightbox/favorite_lightbox_tags.css?inline";
import LIGHTBOX_CSS from "@/core/features/lightbox/styles.css?inline";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import SEARCH_PANEL_CSS from "@/core/app/favorites/search_panel/favorites_search_panel.css?inline";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import TAB_STRIP_TOGGLE_CSS from "@/core/app/favorites/search_panel/tab_strip_toggle.css?inline";
import { Tabs } from "@/core/ui/components/tabs/tabs";
import UI_CSS from "@/core/ui/styles.css?inline";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { h } from "@/core/ui/h/h";
import { measureFavoritesLoadProgress } from "@/core/app/favorites/favorites_load_progress_measurer";

export const FAVORITES_APP_STYLES = [
  UI_CSS,
  FAVORITES_CSS,
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
  favorites: Pick<FavoritesService, "loadState" | "loadStatus">;
  workspace: FavoritesWorkspace;
  lightboxView: HTMLElement;
  preferences: Pick<AppPreferences["favorites"], "activeTool" | "tabStripVisible">;
  zenEnabled: Readable<boolean>;
  renderTool: (tool: ActivityBarItem) => HTMLElement;
  renderPanel: (tab: FavoritesTab) => HTMLElement;
}

export function FavoritesApp({ favorites, workspace, lightboxView, preferences, zenEnabled, renderTool, renderPanel }: FavoritesAppProps): HTMLElement[] {
  return [
    <div className={FavoritesAppClass.root} data-zen={computed(() => (zenEnabled.value ? "" : null))}>
      <div className={FavoritesAppClass.loadLine}>
        <ProgressLine label="Loading favorites" progress={computed(() => measureFavoritesLoadProgress(favorites.loadState.value))} />
      </div>
      <main className={FavoritesAppClass.panes}>
        <ActivityBar
          items={TOOLS}
          value={preferences.activeTool}
          renderView={tool => (
            <ViewPane
              title={tool.label}
              actions={[{ label: "Reset all settings", icon: "reset", disabled: new Signal(true), onClick: () => undefined }]}
            >
              {renderTool(tool)}
            </ViewPane>
          )}
          onValueChange={id => preferences.activeTool.set(id)}
        />
        <Tabs<FavoritesTab>
          manager={workspace.tabManager}
          label={({ value }) => value.title}
          renderPanel={({ value }) => renderPanel(value)}
          stripVisible={preferences.tabStripVisible}
          trailing={<StatusText text={favorites.loadStatus} />}
          onAdd={() => workspace.openBlankTab()}
          onClose={id => workspace.closeTab(id)}
          onCloseAll={() => workspace.closeAllTabs()}
        />
      </main>
      <div className={FavoritesAppClass.zenHint} role="status" hidden={computed(() => !zenEnabled.value)} data-zen-stage="">
        Press Z or Esc to exit Zen
      </div>
    </div>,
    lightboxView
  ];
}
