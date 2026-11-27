import { LabShell, LabShellProps } from "@/targets/lab/shell/lab_shell";
import { h, render } from "@/core/ui/h/h";
import { DEFAULT_APP_FONT } from "@/core/ui/fonts/default_app_font";
import LAB_CSS from "@/targets/lab/lab.css?inline";
import { MountableApp } from "@/core/app/mountable_app";
import { Signal } from "@/core/utils/reactive/signal";
import { THEME_DEFINITIONS } from "@/core/ui/theme/theme_definitions";
import UI_CSS from "@/core/ui/styles.css?inline";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

type LabTab = Parameters<LabShellProps["onActiveTabChange"]>[0];

export interface LabComposerDependencies {
  renderFavoritesPanel: () => HTMLElement;
  renderStoragePanel: () => HTMLElement;
  renderBenchmarksPanel: () => HTMLElement;
}

export function composeLab({ renderFavoritesPanel, renderStoragePanel, renderBenchmarksPanel }: LabComposerDependencies): MountableApp {
  const renderPanels: Record<LabTab, () => HTMLElement> = {
    favorites: renderFavoritesPanel,
    storage: renderStoragePanel,
    benchmarks: renderBenchmarksPanel
  };
  const activeTab = new Signal<LabTab>("favorites");
  return {
    mount: (container): void => {
      const appRoot = mountAppRoot(container, {
        colorScheme: "dark", themeDefinition: THEME_DEFINITIONS.rule34, appFont: DEFAULT_APP_FONT, styles: [UI_CSS, LAB_CSS]
      });

      appRoot.append(render(container.ownerDocument, () => h(LabShell, {
        activeTab,
        renderPanel: labTab => renderPanels[labTab](),
        onActiveTabChange: (labTab): void => {
          activeTab.value = labTab;
        }
      })).result);
    }
  };
}
