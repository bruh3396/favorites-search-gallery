import { SettingsClass } from "@/lib/ui/settings/classes";
import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { createElement } from "@/utils/dom/element_factory";
import { searchField } from "@/lib/ui/widgets/search_field";
import { toggleDataset } from "@/utils/dom/dataset";

export function buildFilterInput(panel: HTMLElement, hideWhileFiltering: HTMLElement[] = []): HTMLElement {
  const field = searchField("Search Settings", (value) => filterSettings(panel, value, hideWhileFiltering));
  return createElement("div", { className: `${SettingsClass.filter} ${WidgetSelectors.separatorBelow}`, children: [field] });
}

function filterSettings(panel: HTMLElement, query: string, hideWhileFiltering: HTMLElement[]): void {
  const terms = parseQuery(query);
  const isFiltering = terms.length > 0;
  let totalVisibleRows = 0;

  for (const section of panel.querySelectorAll<HTMLElement>(`.${SettingsClass.section}`)) {
    const visibleRows = filterSection(section, terms);

    totalVisibleRows += visibleRows;
    toggleDataset(section, "filtered", visibleRows === 0);
  }

  hideWhileFiltering.forEach(element => toggleDataset(element, "hidden", isFiltering));
  toggleDataset(panel, "filtering", isFiltering);
  toggleDataset(panel, "empty", isFiltering && totalVisibleRows === 0);
}

function parseQuery(query: string): string[] {
  return query.toLowerCase().split(/\s+/u).filter((term) => term !== "");
}

function filterSection(section: HTMLElement, terms: string[]): number {
  const title = section.querySelector(`.${SettingsClass.sectionTitle}`)?.textContent ?? "";
  let visibleRows = 0;

  for (const row of section.querySelectorAll<HTMLElement>(`.${SettingsClass.row}`)) {
    const haystack = `${title} ${row.dataset.keywords ?? ""}`.toLowerCase();
    const matches = terms.every(term => haystack.includes(term));

    toggleDataset(row, "filtered", !matches);
    visibleRows += matches ? 1 : 0;
  }
  return visibleRows;
}
