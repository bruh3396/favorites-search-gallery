import { Child, h } from "@/core/ui/h/h";
import { Readable, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope } from "@/core/utils/reactive/scope";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { KeyCap } from "@/core/ui/components/key_cap/key_cap";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import { TabPanel } from "@/core/ui/components/tabs/tab_panel";
import { formatKeyLabel } from "@/core/ui/key_bindings/key_label_formatter";
import { measureFavoritesLoadProgress } from "@/core/app/favorites/favorites_load_progress_measurer";

export const FavoritesAppClass = {
  root: "fsg-FavoritesApp",
  loadLine: "fsg-FavoritesApp-loadLine",
  panes: "fsg-FavoritesApp-panes",
  tabs: "fsg-FavoritesApp-tabs",
  zenHint: "fsg-FavoritesApp-zenHint"
} as const;

export interface FavoritesAppProps {
  favoritesService: Pick<FavoritesService, "loadState">;
  favoritesWorkspace: Pick<FavoritesWorkspace, "tabManager">;
  lightboxView: HTMLElement;
  activityBar: HTMLElement;
  tabsHeaderChild: Child;
  zenEnabled: Readable<boolean>;
  zenExitKeys: Readable<readonly string[]>;
  renderPanel: (favoritesTab: FavoritesTab) => HTMLElement;
}

export function FavoritesApp({
  favoritesService, favoritesWorkspace, lightboxView, activityBar, tabsHeaderChild, zenEnabled, zenExitKeys, renderPanel
}: FavoritesAppProps): HTMLElement[] {
  const zenExitKeyList = <span />;
  const createZenExitKeysScope = captureScope();
  let shownZenExitKeys: Scoped<(Node | string)[]> | null = null;

  effect(() => {
    const currentZenExitKeys = zenExitKeys.value;

    shownZenExitKeys?.dispose();
    shownZenExitKeys = createZenExitKeysScope(() => untracked(() => listZenExitKeyNodes(currentZenExitKeys)));
    zenExitKeyList.replaceChildren(...shownZenExitKeys.result);
  });
  return [
    <div className={FavoritesAppClass.root} data-zen={computed(() => (zenEnabled.value ? "" : null))}>
      <div className={FavoritesAppClass.loadLine}>
        <ProgressLine label="Loading Favorites" progress={computed(() => measureFavoritesLoadProgress(favoritesService.loadState.value))} />
      </div>
      <main className={FavoritesAppClass.panes}>
        {activityBar}
        <div className={FavoritesAppClass.tabs}>
          {tabsHeaderChild}
          <TabPanel<FavoritesTab> tabManager={favoritesWorkspace.tabManager} renderPanel={({ value: favoritesTab }) => renderPanel(favoritesTab)} />
        </div>
      </main>
      <div
        className={FavoritesAppClass.zenHint}
        role="status"
        hidden={computed(() => !zenEnabled.value || zenExitKeys.value.length === 0)}
        data-zen-stage=""
      >
        Press {zenExitKeyList} to exit Zen
      </div>
    </div>,
    lightboxView
  ];
}

function listZenExitKeyNodes(zenExitKeys: readonly string[]): (Node | string)[] {
  return zenExitKeys.flatMap((key, keyIndex) => [
    ...keyIndex === 0 ? [] : [chooseKeySeparator(keyIndex, zenExitKeys.length)],
    <KeyCap label={formatKeyLabel(key)} />
  ]);
}

function chooseKeySeparator(keyIndex: number, keyCount: number): string {
  return keyIndex === keyCount - 1 ? " or " : ", ";
}
