import { getQueryParamFromUrl } from "@/utils/string/url";

export function getQueryParam(name: string): string | null {
  return getQueryParamFromUrl(window.location.href, name);
}
