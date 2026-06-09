import { ORIGIN } from "@/lib/rule34_constants";

const POST_VOTE_URL = `${ORIGIN}/index.php?page=post&s=vote&type=up&id=`;
const REMOVE_FAVORITE_URL = `${ORIGIN}/index.php?page=favorites&s=delete&id=`;
const ADD_FAVORITE_URL = `${ORIGIN}/public/addfav.php?id=`;

export function buildPostVoteUrl(id: string): string {
  return `${POST_VOTE_URL}${id}`;
}

export function buildRemoveFavoriteUrl(id: string): string {
  return `${REMOVE_FAVORITE_URL}${id}`;
}

export function buildAddFavoriteUrl(id: string): string {
  return `${ADD_FAVORITE_URL}${id}`;
}
