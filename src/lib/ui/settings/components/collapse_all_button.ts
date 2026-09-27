import { isCollapsed, setCollapsed } from "@/lib/ui/settings/components/section";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";
import { toggleDataset } from "@/utils/browser/dataset";

export class CollapseAllButton {
  public readonly element: HTMLButtonElement;
  private readonly sections: HTMLElement[];

  constructor(sections: HTMLElement[], onToggleAll: (collapsed: boolean) => void) {
    this.sections = sections;
    this.element = createElement("button", { className: SettingsClass.collapseExpand, children: [icon("collapseAll"), icon("expandAll")] });
    this.element.type = "button";
    this.element.addEventListener("click", () => {
      const wasCollapsed = !this.allCollapsed();

      this.sections.forEach(section => setCollapsed(section, wasCollapsed));
      onToggleAll(wasCollapsed);
      this.refresh();
    });
    this.refresh();
  }

  public refresh(): void {
    const wasCollapsed = this.allCollapsed();

    toggleDataset(this.element, "collapsed", wasCollapsed);
    addTooltip(this.element, `${wasCollapsed ? "Expand" : "Collapse"} all`, "below");
  }

  private allCollapsed(): boolean {
    return this.sections.length > 0 && this.sections.every(isCollapsed);
  }
}
