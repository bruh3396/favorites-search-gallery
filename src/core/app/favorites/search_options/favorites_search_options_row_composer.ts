import { Chip } from "@/core/ui/components/chip/chip";
import { FavoritesSearchSettingsRow } from "@/core/app/favorites/search_settings/favorites_search_settings_row";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesSortChip } from "@/core/app/favorites/search_settings/favorites_sort_chip";
import { MaskChip } from "@/core/ui/components/mask_chip/mask_chip";
import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";
import { toPostStatusMask } from "@/core/domain/post/post_status_mask";
import { toRatingMask } from "@/core/domain/post/rating_mask";

export interface FavoritesSearchSettingsRowConfiguration {
  readonly userOwnsFavorites: boolean;
}

export interface FavoritesSearchSettingsRowDependencies {
  favoritesSession: Pick<
    FavoritesSession,
    "searchSettings" | "changedSearchSettingCount" | "shuffle" | "invert" | "toggleBlacklist" | "updateSearchSettings" | "resetSearchSettings"
  >;
}

export function composeFavoritesSearchSettingsRow(
  configuration: FavoritesSearchSettingsRowConfiguration,
  dependencies: FavoritesSearchSettingsRowDependencies
): HTMLElement {
  const { favoritesSession } = dependencies;
  const { searchSettings: favoritesSearchSettings } = favoritesSession;
  const isShuffled = computed(() => favoritesSearchSettings.value.isShuffled);
  const isInverted = computed(() => favoritesSearchSettings.value.isInverted);
  const isBlacklistEnabled = computed(() => favoritesSearchSettings.value.isBlacklistEnabled);
  return h(FavoritesSearchSettingsRow, {
    changedSearchSettingCount: favoritesSession.changedSearchSettingCount,
    resetSearchSettings: () => favoritesSession.resetSearchSettings(),
    children: [
      h(FavoritesSortChip, {
        favoritesSearchSettings,
        onSortKeyChange: sortKey => favoritesSession.updateSearchSettings({ sortKey }),
        onSortAscendingChange: isSortAscending => favoritesSession.updateSearchSettings({ isSortAscending })
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
        value: computed(() => favoritesSearchSettings.value.allowedStatuses),
        onValueChange: allowedStatuses => favoritesSession.updateSearchSettings({ allowedStatuses })
      }),
      h(MaskChip, {
        label: "Rating",
        controlChoices: [
          { value: toRatingMask("explicit"), label: "Explicit" },
          { value: toRatingMask("questionable"), label: "Questionable" },
          { value: toRatingMask("safe"), label: "Safe" }
        ],
        value: computed(() => favoritesSearchSettings.value.allowedRatings),
        onValueChange: allowedRatings => favoritesSession.updateSearchSettings({ allowedRatings })
      })
    ]
  });
}
