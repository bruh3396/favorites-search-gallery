import { LabShell, LabShellProps } from "@/targets/lab/shell/lab_shell";
import { h, render } from "@/core/ui/h/h";
import { AppRoot } from "@/core/ui/app_root/app_root";
import { DEFAULT_APP_FONT } from "@/core/ui/fonts/default_app_font";
import LAB_CSS from "@/targets/lab/lab.css?inline";
import { MountableApp } from "@/core/app/mountable_app";
import { Signal } from "@/core/utils/reactive/signal";
import { THEME_DEFINITIONS } from "@/core/ui/theme/theme_definitions";
import UI_CSS from "@/core/ui/styles.css?inline";

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
      const appRoot = new AppRoot({
        colorScheme: "dark", themeDefinition: THEME_DEFINITIONS.rule34, appFont: DEFAULT_APP_FONT, styles: [UI_CSS, LAB_CSS]
      }, container.ownerDocument);

      appRoot.mount(container);
      appRoot.element.append(render(container.ownerDocument, () => h(LabShell, {
        activeTab,
        renderPanel: labTab => renderPanels[labTab](),
        onActiveTabChange: (labTab): void => {
          activeTab.value = labTab;
        }
      })).result);
    }
  };
}
