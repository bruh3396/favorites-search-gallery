import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesView from "../view/favorites_view";
import { Favorite } from "../../../types/favorite";

export const swapFavoriteButton = (id: string): void => FavoritesView.swapFavoriteButton(FavoritesModel.getFavorite(id));
export const addToIndex = (favorites: Favorite): void => FavoritesModel.addToIndex([favorites]);
export const removeFromIndex = (favorites: Favorite): void => FavoritesModel.removeFromIndex([favorites]);
