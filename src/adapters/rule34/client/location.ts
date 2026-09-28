import { AppMode } from "@/core/boundary/environment";

export function readPageMode(): AppMode | null {
  const page = readQueryParam("page");

  if (page === "favorites") {
    return "favorites";
  }

  if (page === "post" && readQueryParam("s") === "list") {
    return "posts";
  }
  return null;
}

export function readFavoritesPageId(): string {
  return readQueryParam("id") ?? "";
}

export function readQueryParam(name: string): string | null {
  return new URL(location.href).searchParams.get(name);
}
