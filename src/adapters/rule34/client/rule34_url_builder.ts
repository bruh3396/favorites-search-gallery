const RULE34_ORIGIN = "https://rule34.xxx";
const INDEX_URL = `${RULE34_ORIGIN}/index.php?page=`;
const POSTS_PER_POST_LIST_PAGE = 42;

export const RULE34_FAVORITES_PER_PAGE = 50;

export function buildRule34FavoritesPageUrl(pageId: string, offset: number): string {
  return `${INDEX_URL}favorites&s=view&id=${pageId}&pid=${offset}`;
}

export function rule34FavoritesPageOffset(pageIndex: number): number {
  return pageIndex * RULE34_FAVORITES_PER_PAGE;
}

export function buildRule34PostListUrl(searchQuery: string): string {
  return `${INDEX_URL}post&s=list&tags=${encodeURIComponent(searchQuery)}`;
}

export function buildRule34PostListPageUrl(searchQuery: string, pageIndex: number): string {
  return `${buildRule34PostListUrl(searchQuery)}&pid=${rule34PostListPageOffset(pageIndex)}`;
}

export function rule34PostListPageOffset(pageIndex: number): number {
  return pageIndex * POSTS_PER_POST_LIST_PAGE;
}

export function rule34PostListPageIndex(offset: number): number {
  return Math.round(offset / POSTS_PER_POST_LIST_PAGE);
}

export function buildRule34PostPageUrl(id: string): string {
  return `${INDEX_URL}post&s=view&id=${id}`;
}

export function buildRule34ProfilePageUrl(id: string): string {
  return `${INDEX_URL}account&s=profile&id=${id}`;
}

export function buildRule34AddFavoriteUrl(id: string): string {
  return `${RULE34_ORIGIN}/public/addfav.php?id=${id}`;
}

export function buildRule34PostVoteUrl(id: string): string {
  return `${INDEX_URL}post&s=vote&type=up&id=${id}`;
}

export function buildRule34RemoveFavoriteUrl(id: string): string {
  return `${INDEX_URL}favorites&s=delete&id=${id}`;
}
