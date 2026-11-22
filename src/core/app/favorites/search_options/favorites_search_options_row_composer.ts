import { Chip } from "@/core/ui/components/chip/chip";
import { FavoritesSearchOptionsRow } from "@/core/app/favorites/search_options/favorites_search_options_row";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesSortChip } from "@/core/app/favorites/search_options/favorites_sort_chip";
import { MaskChip } from "@/core/ui/components/mask_chip/mask_chip";
import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";
import { toPostStatusMask } from "@/core/domain/post/post_status_mask";
import { toRatingMask } from "@/core/domain/post/rating_mask";

export interface FavoritesSearchOptionsRowConfiguration {
  readonly userOwnsFavorites: boolean;
}

export interface FavoritesSearchOptionsRowDependencies {
  favoritesSession: Pick<
    FavoritesSession,
    "searchOptions" | "changedSearchOptionCount" | "shuffle" | "invert" | "toggleBlacklist" | "updateSearchOptions" | "resetSearchOptions"
  >;
}

export function composeFavoritesSearchOptionsRow(
  configuration: FavoritesSearchOptionsRowConfiguration,
  dependencies: FavoritesSearchOptionsRowDependencies
): HTMLElement {
  const { favoritesSession } = dependencies;
  const { searchOptions: favoritesSearchOptions } = favoritesSession;
  const isShuffled = computed(() => favoritesSearchOptions.value.isShuffled);
  const isInverted = computed(() => favoritesSearchOptions.value.isInverted);
  const isBlacklistEnabled = computed(() => favoritesSearchOptions.value.isBlacklistEnabled);
  return h(FavoritesSearchOptionsRow, {
    changedSearchOptionCount: favoritesSession.changedSearchOptionCount,
    resetSearchOptions: () => favoritesSession.resetSearchOptions(),
    children: [
      h(FavoritesSortChip, {
        favoritesSearchOptions,
        onSortKeyChange: sortKey => favoritesSession.updateSearchOptions({ sortKey }),
        onSortAscendingChange: isSortAscending => favoritesSession.updateSearchOptions({ isSortAscending })
      }),
      h(Chip, { label: "Shuffle", highlighted: isShuffled, onClick: () => favoritesSession.shuffle() }),
      h(Chip, { label: "Invert", highlighted: isInverted, pressed: isInverted, onClick: () => favoritesSession.invert() }),
      configuration.userOwnsFavorites && h(Chip, {
        label: "Blacklist",
        highlighted: isBlacklistEnabled,
        pressed: isBlacklistEnabled,
        onClick: () => favoritesSession.toggleBlacklist()
      }),
      h(MaskChip, {
        label: "Status",
        controlChoices: [
          { value: toPostStatusMask("active") | toPostStatusMask("deleted"), label: "Available" },
          { value: toPostStatusMask("purged"), label: "Removed" }
        ],
        value: computed(() => favoritesSearchOptions.value.allowedStatuses),
        onValueChange: allowedStatuses => favoritesSession.updateSearchOptions({ allowedStatuses })
      }),
      h(MaskChip, {
        label: "Rating",
        controlChoices: [
          { value: toRatingMask("explicit"), label: "Explicit" },
          { value: toRatingMask("questionable"), label: "Questionable" },
          { value: toRatingMask("safe"), label: "Safe" }
        ],
        value: computed(() => favoritesSearchOptions.value.allowedRatings),
        onValueChange: allowedRatings => favoritesSession.updateSearchOptions({ allowedRatings })
      })
    ]
  });
}
