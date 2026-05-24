import { SearchPage } from "../types/search_page";

type SearchPageEntry =
  | { status: "loading" }
  | { status: "loaded"; page: SearchPage };

const pageEntries: Map<number, SearchPageEntry> = new Map();

export function has(pageNumber: number): boolean {
  return pageEntries.has(pageNumber);
}

export function get(pageNumber: number): SearchPage | undefined {
  const entry = pageEntries.get(pageNumber);
  return entry?.status === "loaded" ? entry.page : undefined;
}

export function allThumbs(): HTMLElement[] {
  return Array.from(pageEntries.keys())
    .sort((a, b) => a - b)
    .flatMap(n => get(n)?.thumbs ?? []);
}

export function remove(pageNumber: number): void {
  pageEntries.delete(pageNumber);
}

export function markLoading(pageNumber: number): void {
  pageEntries.set(pageNumber, { status: "loading" });
}

export function markLoaded(pageNumber: number, page: SearchPage): void {
  pageEntries.set(pageNumber, { status: "loaded", page });
}
