export const FavoritesScaffoldClass = {
  root: "fsg-FavoritesScaffold",
  header: "fsg-FavoritesScaffold-header",
  search: "fsg-FavoritesScaffold-search",
  status: "fsg-FavoritesScaffold-status",
  paginator: "fsg-FavoritesScaffold-paginator",
  content: "fsg-FavoritesScaffold-content"
} as const;

export interface FavoritesScaffold {
  readonly element: HTMLElement;
  readonly search: HTMLElement;
  readonly status: HTMLElement;
  readonly paginator: HTMLElement;
  readonly content: HTMLElement;
}

export function createFavoritesScaffold(ownerDocument: Document): FavoritesScaffold {
  const root = ownerDocument.createElement("main");
  const header = ownerDocument.createElement("header");
  const search = ownerDocument.createElement("div");
  const status = ownerDocument.createElement("div");
  const paginator = ownerDocument.createElement("div");
  const content = ownerDocument.createElement("div");

  root.className = FavoritesScaffoldClass.root;
  header.className = FavoritesScaffoldClass.header;
  search.className = FavoritesScaffoldClass.search;
  status.className = FavoritesScaffoldClass.status;
  paginator.className = FavoritesScaffoldClass.paginator;
  content.className = FavoritesScaffoldClass.content;
  header.append(search, status, paginator);
  root.append(header, content);
  return { element: root, search, status, paginator, content };
}
