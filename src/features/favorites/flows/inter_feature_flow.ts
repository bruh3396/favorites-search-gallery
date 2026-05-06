import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesView from "../view/favorites_view";

export const swapFavoriteButton = (id: string): void => FavoritesView.swapFavoriteButton(FavoritesModel.getFavorite(id));
