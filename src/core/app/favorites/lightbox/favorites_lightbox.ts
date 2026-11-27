import { FavoriteLightboxDetailsDependencies, composeFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details_composer";
import { Lightbox, LightboxDependencies, createLightbox } from "@/core/features/lightbox/lightbox";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";

export interface FavoritesLightboxDependencies extends Omit<LightboxDependencies<Favorite>, "preferences" | "locateItem" | "details" | "favorite"> {
  preferences: LightboxDependencies<Favorite>["preferences"] & {
    details: FavoriteLightboxDetailsDependencies["preferences"] & Pick<LightboxDetails<Favorite>, "isOpen">;
  };
  clipboard: FavoriteLightboxDetailsDependencies["clipboard"];
  localTagCategories: FavoriteLightboxDetailsDependencies["localTagCategories"];
  favoritesService: Pick<FavoritesService, "isFavorited" | "actions">;
  favoritesWorkspace: Pick<FavoritesWorkspace, "locate" | "turnToPageContaining" | "reveal">;
}

export function createFavoritesLightbox(dependencies: FavoritesLightboxDependencies): Lightbox<Favorite> {
  const {
    scheduler, sizeObserver, viewport, remoteMedia, actions: lightboxActions, lightboxKeyBindings,
    preferences: favoritesLightboxPreferences, clipboard, localTagCategories, favoritesService, favoritesWorkspace
  } = dependencies;
  const lightbox = createLightbox<Favorite>({
    scheduler, sizeObserver, viewport, remoteMedia, actions: lightboxActions, preferences: favoritesLightboxPreferences, lightboxKeyBindings,
    locateItem: favorite => favoritesWorkspace.locate(favorite),
    details: {
      isOpen: favoritesLightboxPreferences.details.isOpen,
      createContent: favorite => composeFavoriteLightboxDetails(favorite, {
        preferences: favoritesLightboxPreferences.details, clipboard, scheduler, localTagCategories
      })
    },
    favorite: {
      isFavorited: favorite => favoritesService.isFavorited(favorite.id),
      add: (favorite): void => {
        favoritesService.actions.add(favorite.id).catch(console.error);
      }
    }
  });

  lightbox.settled.on(favorite => favoritesWorkspace.turnToPageContaining(favorite));
  lightbox.closed.on(favorite => favoritesWorkspace.reveal(favorite));
  return lightbox;
}
