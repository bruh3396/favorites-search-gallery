import { Favorite } from "../../../types/favorite";
import { FavoritesInfiniteScrollFlow } from "./infinite_scroll_flow";
import { FavoritesPaginationFlow } from "./pagination_flow";
import { FavoritesPresentationFlow } from "../types/favorite_types";
import { NavigationKey } from "../../../types/input";
import { Preferences } from "../../../lib/preferences/preferences";

export const present = (favorites: Favorite[]): void => activePresenter().present(favorites);
export const presentNothing = (): void => activePresenter().present([]);
export const reveal = (id: string): void => activePresenter().reveal(id);
export const handleNewSearchResults = (): void => activePresenter().handleNewSearchResults();
export const presentWhileNavigatingGallery = (direction: NavigationKey): boolean => activePresenter().presentWhileNavigatingGallery(direction);

const activePresenter = (): FavoritesPresentationFlow => (Preferences.infiniteScroll.value ? FavoritesInfiniteScrollFlow : FavoritesPaginationFlow);
