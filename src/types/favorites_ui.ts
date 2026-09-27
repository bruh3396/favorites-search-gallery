export const FavoritesDrawerSectionNames = ["settings", "snippets", "tags", "download", "change", "help"] as const;
export type FavoritesDrawerSectionName = (typeof FavoritesDrawerSectionNames)[number];

export type FavoritesDrawerSectionContent = {
  mount?: (container: HTMLElement) => void;
  actions?: HTMLElement[];
};

export type FavoritesDrawerContents = Partial<Record<FavoritesDrawerSectionName, FavoritesDrawerSectionContent>>;

export interface FavoritesDrawerSection {
  label: string;
  tab: HTMLElement;
  root: HTMLElement;
  title: HTMLElement;
  body: HTMLElement;
}

export type FavoritesDrawerSlots = Record<FavoritesDrawerSectionName, FavoritesDrawerSection>;

export interface FavoritesToolbarSlots {
  drawerToggle: HTMLElement;
  searchField: HTMLElement;
  searchButton: HTMLElement;
  searchActions: HTMLElement;
  buttons: HTMLElement;
  aboutHelp: HTMLElement;
  aboutVersion: HTMLElement;
  pagination: HTMLElement;
  rangeIndicator: HTMLElement;
  resultsCount: HTMLElement;
  loadStatus: HTMLElement;
}
