import * as ExtensionResolver from "../../../lib/media/media_extension_resolver";
import * as FavoritesModel from "../model/favorites_model";

export function resetFavorites(): void {
  FavoritesModel.deleteDatabase();
  ExtensionResolver.deleteExtensionsDatabase();
}
