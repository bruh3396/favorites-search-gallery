import { Favorite } from "../../../types/favorite";
import { FavoritesInfiniteScrollFlow } from "./favorites_infinite_scroll_flow";
import { FavoritesPaginationFlow } from "./favorites_pagination_flow";
import { FavoritesPresentationFlow } from "../type/favorite_types";
import { NavigationKey } from "../../../types/input";
import { Preferences } from "../../../lib/preferences/preferences";

const currentPresenter = (): FavoritesPresentationFlow => (Preferences.infiniteScroll.value ? FavoritesInfiniteScrollFlow : FavoritesPaginationFlow);

export const present = (favorites: Favorite[]): void => currentPresenter().present(favorites);
export const presentNothing = (): void => currentPresenter().present([]);
export const reveal = (id: string): void => currentPresenter().reveal(id);
export const handleNewSearchResults = (): void => currentPresenter().handleNewSearchResults();
export const presentWhileNavigatingGallery = (direction: NavigationKey): boolean => currentPresenter().presentWhileNavigatingGallery(direction);
