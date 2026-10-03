import { BASE_INDEX_URL } from "@/adapters/rule34/client/site/index_url";

export function profilePageUrl(id: string): string {
  return `${BASE_INDEX_URL}account&s=profile&id=${id}`;
}
