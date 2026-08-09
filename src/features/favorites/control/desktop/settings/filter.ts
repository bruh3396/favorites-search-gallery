import { SettingsClass } from "@/lib/ui/settings/classes";
import { createElement } from "@/utils/dom/element_factory";
import { toggleDataset } from "@/utils/dom/dataset";

export function buildFilterInput(panel: HTMLElement, hideWhileFiltering: HTMLElement[] = []): HTMLElement {
  const input = createElement("input", { className: SettingsClass.filterInput });

  input.type = "text";
  input.placeholder = "Search Settings";
  input.spellcheck = false;

  input.addEventListener("input", () => {
    filterSettings(panel, input.value, hideWhileFiltering);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && input.value !== "") {
      event.stopPropagation();
      input.value = "";
      filterSettings(panel, "", hideWhileFiltering);
    }
  });
  return createElement("div", { className: SettingsClass.filter, children: [input] });
}

function filterSettings(panel: HTMLElement, query: string, hideWhileFiltering: HTMLElement[]): void {
  const terms = parseQuery(query);
  const filtering = terms.length > 0;
  let totalVisibleRows = 0;

  for (const section of panel.querySelectorAll<HTMLElement>(`.${SettingsClass.section}`)) {
    const visibleRows = filterSection(section, terms);

    totalVisibleRows += visibleRows;
    toggleDataset(section, "filtered", visibleRows === 0);
  }

  hideWhileFiltering.forEach(element => toggleDataset(element, "hidden", filtering));
  toggleDataset(panel, "filtering", filtering);
  toggleDataset(panel, "empty", filtering && totalVisibleRows === 0);
}

function parseQuery(query: string): string[] {
  return query.toLowerCase().split(/\s+/u).filter((term) => term !== "");
}

function filterSection(section: HTMLElement, terms: string[]): number {
  const title = section.querySelector(`.${SettingsClass.sectionTitle}`)?.textContent ?? "";
  let visibleRows = 0;

  for (const row of section.querySelectorAll<HTMLElement>(`.${SettingsClass.row}`)) {
    const haystack = `${title} ${row.dataset.keywords ?? ""}`.toLowerCase();
    const matched = terms.every(term => haystack.includes(term));

    toggleDataset(row, "filtered", !matched);
    visibleRows += matched ? 1 : 0;
  }
  return visibleRows;
}
