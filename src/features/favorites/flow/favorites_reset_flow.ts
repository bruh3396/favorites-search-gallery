import * as ExtensionCache from "../../../lib/extension_cache";
import * as FavoritesModel from "../model/favorites_model";

export function resetFavorites(): void {
  FavoritesModel.deleteDatabase();
  ExtensionCache.deleteExtensionsDatabase();
}
