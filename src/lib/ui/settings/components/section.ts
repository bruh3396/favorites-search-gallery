import { SettingsClass } from "@/lib/ui/settings/classes";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";
import { toggleDataset } from "@/utils/browser/dataset";

export interface CollapsibleSectionOptions {
  title: string;
  collapsed: boolean;
  children: HTMLElement[];
  onToggle: (collapsed: boolean) => void;
}

export function buildCollapsibleSection(options: CollapsibleSectionOptions): HTMLElement {
  const section = createElement("section", { className: SettingsClass.section });
  const title = createElement("span", { className: SettingsClass.sectionTitle, textContent: options.title });
  const header = createElement("button", { className: SettingsClass.sectionHeader, children: [title, icon("chevronDown")] });
  const group = createElement("div", { className: SettingsClass.group, children: options.children });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [group] });

  header.type = "button";
  header.addEventListener("click", () => {
    const wasCollapsed = !isCollapsed(section);

    setCollapsed(section, wasCollapsed);
    options.onToggle(wasCollapsed);
  });
  setCollapsed(section, options.collapsed);
  section.append(header, wrap);
  return section;
}

export function isCollapsed(section: HTMLElement): boolean {
  return section.dataset.collapsed !== undefined;
}

export function setCollapsed(section: HTMLElement, collapsed: boolean): void {
  toggleDataset(section, "collapsed", collapsed);
}
