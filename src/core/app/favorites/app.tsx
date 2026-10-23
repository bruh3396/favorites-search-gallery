import { FAVORITES_STYLES, FavoritesService } from "@/core/features/favorites/favorites";
import { FavoritesSearchPanel, FavoritesSearchPanelProps } from "@/core/app/favorites/panel/search";
import { LIGHTBOX_STYLES, Lightbox } from "@/core/features/lightbox/lightbox";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesShell } from "@/core/app/favorites/shell/shell";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/workspace";
import SEARCH_PANEL_CSS from "@/core/app/favorites/panel/search.css?inline";
import SHELL_CSS from "@/core/app/favorites/shell/shell.css?inline";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { Tabs } from "@/core/ui/components/tabs/tabs";
import UI_CSS from "@/core/ui/styles.css?inline";
import { h } from "@/core/ui/h/h";

export const FAVORITES_APP_STYLES = [UI_CSS, FAVORITES_STYLES, SHELL_CSS, SEARCH_PANEL_CSS, LIGHTBOX_STYLES];

export interface FavoritesAppProps {
  favorites: FavoritesService;
  workspace: FavoritesWorkspace;
  lightbox: Lightbox<Favorite>;
  panel: (tab: FavoritesTab) => FavoritesSearchPanelProps;
}

export function FavoritesApp({ favorites, workspace, lightbox, panel }: FavoritesAppProps): HTMLElement[] {
  return [
    <FavoritesShell
      favorites={favorites}
      panes={[
        <Tabs<FavoritesTab>
          manager={workspace.tabManager}
          label={({ value }) => value.title}
          renderPanel={({ value }) => <FavoritesSearchPanel {...panel(value)} />}
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
