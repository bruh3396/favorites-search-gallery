import { FAVORITES_SORT_KEYS, FavoritesSortKey } from "@/core/features/favorites/search/favorites_sort_key";
import { FavoritesSearchSettings, isReorderingFavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { ChipMenu } from "@/core/ui/components/chip_menu/chip_menu";
import { OptionMenuItem } from "@/core/ui/components/option_menu/option_menu_item";
import { h } from "@/core/ui/h/h";

export interface FavoritesSortChipProps {
  favoritesSearchSettings: Readable<Pick<FavoritesSearchSettings, "sortKey" | "isSortAscending" | "isShuffled">>;
  onSortKeyChange: (sortKey: FavoritesSortKey) => void;
  onSortAscendingChange: (isSortAscending: boolean) => void;
}

const SORT_LABELS: Readonly<Record<FavoritesSortKey, string>> = {
  favorited: "Favorited",
  id: "Uploaded",
  score: "Score",
  width: "Width",
  height: "Height",
  duration: "Duration",
  changedAt: "Changed",
  random: "Random"
};

export function FavoritesSortChip({ favoritesSearchSettings, onSortKeyChange, onSortAscendingChange }: FavoritesSortChipProps): HTMLElement {
  const optionMenuItems: readonly OptionMenuItem[] = [
    ...FAVORITES_SORT_KEYS.map((sortKey): OptionMenuItem => ({
      label: SORT_LABELS[sortKey],
      selected: computed(() => !favoritesSearchSettings.value.isShuffled && favoritesSearchSettings.value.sortKey === sortKey),
      onChoose: (): void => onSortKeyChange(sortKey)
    })),
    {
      label: "Ascending",
      selected: computed(() => favoritesSearchSettings.value.isSortAscending),
      disabled: computed(() => favoritesSearchSettings.value.sortKey === "random"),
      startsGroup: true,
      keepsOpen: true,
      onChoose: (): void => onSortAscendingChange(!favoritesSearchSettings.peek().isSortAscending)
    }
  ];
  return (
    <ChipMenu
      label="Sort"
      value={computed(() => describeSort(favoritesSearchSettings.value))}
      highlighted={computed(() => isReorderingFavoritesSearchSettings(favoritesSearchSettings.value))}
      optionMenuItems={optionMenuItems}
    />
  );
}

function describeSort({ sortKey, isSortAscending, isShuffled }: Pick<FavoritesSearchSettings, "sortKey" | "isSortAscending" | "isShuffled">): string {
  if (isShuffled) {
    return "Shuffled";
  }
  const label = SORT_LABELS[sortKey];
  return sortKey === "random" ? label : `${label} ${isSortAscending ? "↑" : "↓"}`;
}
