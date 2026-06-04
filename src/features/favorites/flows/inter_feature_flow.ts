import * as FavoritesModel from "@/features/favorites/model/favorites_model";

export const swapFavoriteButton = (id: string): void => FavoritesModel.getFavorite(id)?.swapFavoriteButton();
