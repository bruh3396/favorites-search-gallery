import { PostList } from "@/features/post_list_navigator/types/post_list_page";

type PostListEntry =
  | { status: "loading"; loaded: Promise<void> }
  | { status: "loaded"; page: PostList };

const pages: Map<number, PostListEntry> = new Map();

export function isLoaded(pageNumber: number): boolean {
  return pages.get(pageNumber)?.status === "loaded";
}

export function get(pageNumber: number): PostList | undefined {
  const entry = pages.get(pageNumber);
  return entry?.status === "loaded" ? entry.page : undefined;
}

export function pendingLoad(pageNumber: number): Promise<void> | undefined {
  const entry = pages.get(pageNumber);
  return entry?.status === "loading" ? entry.loaded : undefined;
}

export function allThumbs(): HTMLElement[] {
  return Array.from(pages.keys())
    .sort((a, b) => a - b)
    .flatMap(n => get(n)?.thumbs ?? []);
}

export function remove(pageNumber: number): void {
  pages.delete(pageNumber);
}

export function markLoading(pageNumber: number, loaded: Promise<void>): void {
  pages.set(pageNumber, { status: "loading", loaded });
}

export function markLoaded(pageNumber: number, page: PostList): void {
  pages.set(pageNumber, { status: "loaded", page });
}
