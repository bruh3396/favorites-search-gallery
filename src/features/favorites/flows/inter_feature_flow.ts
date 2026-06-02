import * as FavoritesModel from "../model/favorites_model";

export const swapFavoriteButton = (id: string): void => FavoritesModel.getFavorite(id)?.swapFavoriteButton();
