import { FavoriteLightboxDetailsPreferences, createFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { CopyIdButton } from "@/core/app/favorites/lightbox/copy_id_button";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteLightboxTags } from "@/core/app/favorites/lightbox/favorite_lightbox_tags";
import { LightboxDetailsContent } from "@/core/features/lightbox/details/lightbox_details";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { h } from "@/core/ui/h/h";

export interface FavoriteLightboxDetailsDependencies {
  preferences: FavoriteLightboxDetailsPreferences;
  clipboard: Pick<Clipboard, "write">;
  scheduler: Pick<Scheduler, "schedule">;
  localTagCategories: Pick<LocalTagCategories, "getMany">;
}

export function composeFavoriteLightboxDetails(
  favorite: Readable<Pick<Favorite, "id" | "tags"> | undefined>,
  dependencies: FavoriteLightboxDetailsDependencies
): LightboxDetailsContent {
  const { preferences: favoriteLightboxDetailsPreferences, clipboard, scheduler, localTagCategories } = dependencies;
  return createFavoriteLightboxDetails({
    preferences: favoriteLightboxDetailsPreferences,
    copyIdButton: h(CopyIdButton, { postId: computed(() => favorite.value?.id), clipboard, scheduler, copiedDuration: 1_500 }),
    tags: h(FavoriteLightboxTags, {
      favorite, localTagCategories, collapsedTagCount: 6,
      organization: favoriteLightboxDetailsPreferences.organization,
      alignment: favoriteLightboxDetailsPreferences.alignment,
      size: favoriteLightboxDetailsPreferences.size
    })
  });
}
