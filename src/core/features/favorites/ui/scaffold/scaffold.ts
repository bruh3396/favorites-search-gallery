export const FavoritesScaffoldClass = {
  root: "fsg-FavoritesScaffold",
  header: "fsg-FavoritesScaffold-header",
  search: "fsg-FavoritesScaffold-search",
  summary: "fsg-FavoritesScaffold-summary",
  content: "fsg-FavoritesScaffold-content",
  footer: "fsg-FavoritesScaffold-footer",
  pager: "fsg-FavoritesScaffold-pager"
} as const;

export interface FavoritesScaffold {
  readonly element: HTMLElement;
  readonly search: HTMLElement;
  readonly summary: HTMLElement;
  readonly content: HTMLElement;
  readonly pager: HTMLElement;
}

export function createFavoritesScaffold(ownerDocument: Document): FavoritesScaffold {
  const root = ownerDocument.createElement("div");
  const header = ownerDocument.createElement("header");
  const search = ownerDocument.createElement("div");
  const summary = ownerDocument.createElement("div");
  const content = ownerDocument.createElement("main");
  const footer = ownerDocument.createElement("footer");
  const pager = ownerDocument.createElement("div");

  root.className = FavoritesScaffoldClass.root;
  header.className = FavoritesScaffoldClass.header;
  search.className = FavoritesScaffoldClass.search;
  summary.className = FavoritesScaffoldClass.summary;
  content.className = FavoritesScaffoldClass.content;
  footer.className = FavoritesScaffoldClass.footer;
  pager.className = FavoritesScaffoldClass.pager;
  header.append(search, summary);
  footer.append(pager);
  root.append(header, content, footer);
  return { element: root, search, summary, content, pager };
}
