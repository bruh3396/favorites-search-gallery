import { Signal, computed } from "@/core/utils/reactive/signal";
import { Button } from "@/core/ui/components/button/button";
import { LabCard } from "@/targets/lab/components/card/lab_card";
import { LabRow } from "@/targets/lab/components/row/lab_row";
import { LabShellClass } from "@/targets/lab/shell/lab_shell";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Stepper } from "@/core/ui/components/stepper/stepper";
import { h } from "@/core/ui/h/h";

export interface FavoritesPanelComposerDependencies {
  scheduler: Pick<Scheduler, "schedule">;
  corpusLocalFavorites: Pick<LocalFavorites, "getAll">;
  labLocalFavorites: Pick<LocalFavorites, "setAll">;
  startFavoritesApp: (container: HTMLElement) => void;
}

export function composeFavoritesPanel({
  scheduler, corpusLocalFavorites, labLocalFavorites, startFavoritesApp
}: FavoritesPanelComposerDependencies): () => HTMLElement {
  let favoritesApp: HTMLElement | null = null;
  return () => {
    const favoritesPanel = h("div", null);
    const corpusPostIds = new Signal<readonly string[]>([]);
    const count = new Signal(0);
    const corpusSize = computed(() => corpusPostIds.value.length);
    const corpusEmpty = computed(() => corpusSize.value === 0);
    const start = async(): Promise<void> => {
      await labLocalFavorites.setAll(corpusPostIds.peek().slice(0, count.peek()));
      favoritesApp = favoritesPanel.ownerDocument.createElement("div");
      favoritesApp.className = LabShellClass.bleed;
      favoritesPanel.replaceChildren(favoritesApp);
      startFavoritesApp(favoritesApp);
    };

    if (favoritesApp !== null) {
      favoritesPanel.append(favoritesApp);
      return favoritesPanel;
    }
    corpusLocalFavorites.getAll().then(postIds => {
      corpusPostIds.value = postIds;
      count.value = postIds.length;
    }).catch(reportError);
    favoritesPanel.append(h(LabCard, {
      children: h(LabRow, {
        name: "Lab",
        controlsChild: [
          h(Stepper, {
            label: "Count",
            min: 1,
            max: corpusSize,
            step: 25_000,
            value: count,
            disabled: corpusEmpty,
            scheduler,
            onValueChange: (value): void => {
              count.value = value;
            }
          }),
          h(Button, {
            label: "All",
            pressed: computed(() => !corpusEmpty.value && count.value === corpusSize.value),
            disabled: corpusEmpty,
            onClick: (): void => {
              count.value = corpusSize.peek();
            }
          })
        ],
        actionsChild: h(Button, { label: "Start", emphasis: "filled", disabled: corpusEmpty, onClick: () => start().catch(reportError) })
      })
    }));
    return favoritesPanel;
  };
}
