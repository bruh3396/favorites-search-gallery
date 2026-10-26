import { ActivityBar, ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";
import FAVORITES_CSS from "@/core/features/favorites/styles.css?inline";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import COPY_ID_BUTTON_CSS from "@/core/app/favorites/lightbox_details/copy_id_button.css?inline";
import { FavoritesPreferences } from "@/core/app/preferences";
import { FavoritesShell } from "@/core/app/favorites/shell/shell";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/workspace";
import LIGHTBOX_DETAILS_CSS from "@/core/app/favorites/lightbox_details/lightbox_details.css?inline";
import LIGHTBOX_CSS from "@/core/features/lightbox/styles.css?inline";
import SEARCH_PANEL_CSS from "@/core/app/favorites/search_panel/search_panel.css?inline";
import SHELL_CSS from "@/core/app/favorites/shell/shell.css?inline";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import TAB_STRIP_TOGGLE_CSS from "@/core/app/favorites/search_panel/tab_strip_toggle.css?inline";
import { Tabs } from "@/core/ui/components/tabs/tabs";
import UI_CSS from "@/core/ui/styles.css?inline";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { h } from "@/core/ui/h/h";

export const FAVORITES_APP_STYLES = [
  UI_CSS,
  FAVORITES_CSS,
  SHELL_CSS,
  SEARCH_PANEL_CSS,
  TAB_STRIP_TOGGLE_CSS,
  LIGHTBOX_CSS,
  LIGHTBOX_DETAILS_CSS,
  COPY_ID_BUTTON_CSS
];

const TOOLS: readonly ActivityBarItem[] = [{ id: "settings", label: "Settings", icon: "settings"}];

export interface FavoritesAppProps {
  favorites: Pick<FavoritesService, "loadState" | "loadStatus">;
  workspace: FavoritesWorkspace;
  lightboxView: HTMLElement;
  preferences: Pick<FavoritesPreferences, "activeTool" | "tabStripVisible">;
  zenEnabled: Readable<boolean>;
  renderTool: (tool: ActivityBarItem) => HTMLElement;
  renderPanel: (tab: FavoritesTab) => HTMLElement;
}

export function FavoritesApp({ favorites, workspace, lightboxView, preferences, zenEnabled, renderTool, renderPanel }: FavoritesAppProps): HTMLElement[] {
  return [
    <FavoritesShell
      favorites={favorites}
      zenEnabled={zenEnabled}
      panes={[
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
        />,
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
      ]}
    />,
    lightboxView
  ];
}
