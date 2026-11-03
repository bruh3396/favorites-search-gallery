import { RULE34_PAGE_SIZE } from "@/adapters/rule34/client/rule34_page_size";

const RULE34_ORIGIN = "https://rule34.xxx";
const INDEX_URL = `${RULE34_ORIGIN}/index.php?page=`;

export function buildRule34FavoritesPageUrl(userId: string, pageIndex: number): string {
  return `${INDEX_URL}favorites&s=view&id=${userId}&pid=${pageIndex * RULE34_PAGE_SIZE.favorites}`;
}

export function buildRule34PostListUrl(searchQuery: string): string {
  return `${INDEX_URL}post&s=list&tags=${encodeURIComponent(searchQuery)}`;
}

export function buildRule34PostListPageUrl(searchQuery: string, pageIndex: number): string {
  return `${buildRule34PostListUrl(searchQuery)}&pid=${pageIndex * RULE34_PAGE_SIZE.postList}`;
}

export function buildRule34PostPageUrl(postId: string): string {
  return `${INDEX_URL}post&s=view&id=${postId}`;
}

export function buildRule34ProfilePageUrl(userId: string): string {
  return `${INDEX_URL}account&s=profile&id=${userId}`;
}

export function buildRule34AccountHomePageUrl(): string {
  return `${INDEX_URL}account&s=home`;
}

export function buildRule34AddFavoriteUrl(postId: string): string {
  return `${RULE34_ORIGIN}/public/addfav.php?id=${postId}`;
}

export function buildRule34PostVoteUrl(postId: string): string {
  return `${INDEX_URL}post&s=vote&type=up&id=${postId}`;
}

export function buildRule34RemoveFavoriteUrl(postId: string): string {
  return `${INDEX_URL}favorites&s=delete&id=${postId}`;
}
