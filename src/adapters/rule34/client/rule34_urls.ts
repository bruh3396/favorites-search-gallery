import { RULE34_PAGE_SIZE } from "@/adapters/rule34/client/rule34_page_size";

const RULE34_ORIGIN = "https://rule34.xxx";
const INDEX_URL = `${RULE34_ORIGIN}/index.php?page=`;

export const RULE34_URLS = {
  favoritesPage: (userId: string, pageIndex: number): string => `${INDEX_URL}favorites&s=view&id=${userId}&pid=${pageIndex * RULE34_PAGE_SIZE.favorites}`,
  postList: (searchQuery: string): string => `${INDEX_URL}post&s=list&tags=${encodeURIComponent(searchQuery)}`,
  postListPage: (searchQuery: string, pageIndex: number): string => `${RULE34_URLS.postList(searchQuery)}&pid=${pageIndex * RULE34_PAGE_SIZE.postList}`,
  postPage: (postId: string): string => `${INDEX_URL}post&s=view&id=${postId}`,
  profilePage: (userId: string): string => `${INDEX_URL}account&s=profile&id=${userId}`,
  accountHomePage: (): string => `${INDEX_URL}account&s=home`,
  addFavorite: (postId: string): string => `${RULE34_ORIGIN}/public/addfav.php?id=${postId}`,
  postVote: (postId: string): string => `${INDEX_URL}post&s=vote&type=up&id=${postId}`,
  removeFavorite: (postId: string): string => `${INDEX_URL}favorites&s=delete&id=${postId}`
} as const;
