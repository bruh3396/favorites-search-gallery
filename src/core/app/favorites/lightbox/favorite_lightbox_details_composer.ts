import { FavoriteLightboxDetailsProps, createFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { CopyIdButton } from "@/core/app/favorites/lightbox/copy_id_button";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteLightboxTags } from "@/core/app/favorites/lightbox/favorite_lightbox_tags";
import { LightboxDetailsContent } from "@/core/features/lightbox/details/lightbox_details_content";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { TagCategoryResolver } from "@/core/features/tag_categories/tag_category_resolver";
import { h } from "@/core/ui/h/h";

export interface FavoriteLightboxDetailsDependencies {
  preferences: FavoriteLightboxDetailsProps["preferences"];
  clipboard: Pick<Clipboard, "write">;
  scheduler: Pick<Scheduler, "schedule">;
  tagCategoryResolver: Pick<TagCategoryResolver, "resolve">;
}

export function composeFavoriteLightboxDetails(
  favorite: Readable<Pick<Favorite, "id" | "tags"> | undefined>,
  dependencies: FavoriteLightboxDetailsDependencies
): LightboxDetailsContent {
  const { preferences: favoriteLightboxDetailsPreferences, clipboard, scheduler, tagCategoryResolver } = dependencies;
  return createFavoriteLightboxDetails({
    preferences: favoriteLightboxDetailsPreferences,
    copyIdButton: h(CopyIdButton, { postId: computed(() => favorite.value?.id), clipboard, scheduler, copiedDuration: 1_500 }),
    tags: h(FavoriteLightboxTags, {
      favorite, tagCategoryResolver, collapsedTagCount: 6,
      organization: favoriteLightboxDetailsPreferences.organization,
      alignment: favoriteLightboxDetailsPreferences.alignment,
      size: favoriteLightboxDetailsPreferences.size
    })
  });
}
