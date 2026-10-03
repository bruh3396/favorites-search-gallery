import { postListPageIndex } from "@/adapters/rule34/client/post_list_page";

export function initialPageNumber(): number {
  const match = (/&pid=(\d+)/).exec(location.href);
  return match === null ? 0 : postListPageIndex(parseInt(match[1], 10));
}

export function baseUrl(): string {
  return location.href.replace(/&pid=(\d+)/, "");
}
