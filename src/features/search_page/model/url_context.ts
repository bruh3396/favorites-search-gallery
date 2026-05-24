import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/rule34_constants";

export function initialPageNumber(): number {
  const match = (/&pid=(\d+)/).exec(location.href);
  return match === null ? 0 : Math.round(parseInt(match[1], 10) / POSTS_PER_SEARCH_PAGE);
}

export function baseUrl(): string {
  return location.href.replace(/&pid=(\d+)/, "");
}
