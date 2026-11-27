import { Readable, effect, untracked } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { TabList } from "@/core/ui/components/tabs/tab_list";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

type LabTab = "favorites" | "storage" | "benchmarks";

export const LabShellClass = {
  root: "fsg-LabShell",
  bar: "fsg-LabShell-bar",
  brand: "fsg-LabShell-brand",
  logo: "fsg-LabShell-logo",
  panel: "fsg-LabShell-panel",
  bleed: "fsg-LabShell-bleed"
} as const;

export interface LabShellProps {
  activeTab: Readable<LabTab>;
  renderPanel: (labTab: LabTab) => HTMLElement;
  onActiveTabChange: (labTab: LabTab) => void;
}

const LAB_TAB_CHOICES: readonly ControlChoice<LabTab>[] = [
  { value: "favorites", label: "Favorites" },
  { value: "storage", label: "Storage" },
  { value: "benchmarks", label: "Benchmarks" }
];

export function LabShell({ activeTab, renderPanel, onActiveTabChange }: LabShellProps): HTMLElement {
  const createPanelScope = captureScope();
  const panel = <div className={LabShellClass.panel} />;
  let shown: Scoped<HTMLElement> | null = null;

  effect(() => {
    const labTab = activeTab.value;

    shown?.dispose();
    shown = createPanelScope(() => untracked(() => renderPanel(labTab)));
    panel.replaceChildren(shown.result);
  });
  onCleanup(() => shown?.dispose());
  return (
    <div className={LabShellClass.root}>
      <header className={LabShellClass.bar}>
        <span className={LabShellClass.brand}>{createIcon("logo", LabShellClass.logo)}Lab</span>
        <TabList
          label="Lab"
          controlChoices={LAB_TAB_CHOICES}
          value={activeTab}
          panel={panel}
          onValueChange={onActiveTabChange}
        />
      </header>
      {panel}
    </div>
  );
}
