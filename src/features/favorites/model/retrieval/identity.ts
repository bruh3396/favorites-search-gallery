import { Environment } from "@/app/context/environment";

type FavoritesIdentitySource = Pick<Environment, "onFavoritesPage" | "favoritesPageId" | "userId">;

export function favoritesPageId(environment: FavoritesIdentitySource): string {
  return environment.favoritesPageId ?? "";
}

export function favoritesDatabaseKey(environment: FavoritesIdentitySource): string {
  return `user${environment.onFavoritesPage ? favoritesPageId(environment) : environment.userId}`;
}
