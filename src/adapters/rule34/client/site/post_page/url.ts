import { BASE_INDEX_URL } from "@/adapters/rule34/client/site/index_url";

export function postPageUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=view&id=${id}`;
}
