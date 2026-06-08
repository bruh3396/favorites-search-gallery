import { PostList } from "@/features/post_list_navigator/types/post_list_page";

type PostListEntry =
  | { status: "loading" }
  | { status: "loaded"; page: PostList };

const pageEntries: Map<number, PostListEntry> = new Map();

export function has(pageNumber: number): boolean {
  return pageEntries.has(pageNumber);
}

export function get(pageNumber: number): PostList | undefined {
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

export function markLoaded(pageNumber: number, page: PostList): void {
  pageEntries.set(pageNumber, { status: "loaded", page });
}
