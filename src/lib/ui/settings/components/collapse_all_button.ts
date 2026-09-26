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
      const collapsed = !this.allCollapsed();

      this.sections.forEach(section => setCollapsed(section, collapsed));
      onToggleAll(collapsed);
      this.refresh();
    });
    this.refresh();
  }

  public refresh(): void {
    const collapsed = this.allCollapsed();

    toggleDataset(this.element, "collapsed", collapsed);
    addTooltip(this.element, `${collapsed ? "Expand" : "Collapse"} all`, "below");
  }

  private allCollapsed(): boolean {
    return this.sections.length > 0 && this.sections.every(isCollapsed);
  }
}
