import * as Extensions from "../../../../../lib/global/extensions";
import * as FavoritesModel from "../../../model/favorites_model";

export function resetFavorites(): void {
  FavoritesModel.deleteDatabase();
  Extensions.deleteExtensionsDatabase();
}
