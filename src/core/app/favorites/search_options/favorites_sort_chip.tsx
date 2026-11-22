import { FAVORITES_SORT_KEYS, FavoritesSortKey } from "@/core/features/favorites/search/favorites_sort_key";
import { FavoritesSearchOptions, isReorderingFavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { ChipMenu } from "@/core/ui/components/chip_menu/chip_menu";
import { OptionMenuItem } from "@/core/ui/components/option_menu/option_menu_item";
import { h } from "@/core/ui/h/h";

export interface FavoritesSortChipProps {
  favoritesSearchOptions: Readable<Pick<FavoritesSearchOptions, "sortKey" | "isSortAscending" | "isShuffled">>;
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

export function FavoritesSortChip({ favoritesSearchOptions, onSortKeyChange, onSortAscendingChange }: FavoritesSortChipProps): HTMLElement {
  const optionMenuItems: readonly OptionMenuItem[] = [
    ...FAVORITES_SORT_KEYS.map((sortKey): OptionMenuItem => ({
      label: SORT_LABELS[sortKey],
      selected: computed(() => !favoritesSearchOptions.value.isShuffled && favoritesSearchOptions.value.sortKey === sortKey),
      onChoose: (): void => onSortKeyChange(sortKey)
    })),
    {
      label: "Ascending",
      selected: computed(() => favoritesSearchOptions.value.isSortAscending),
      disabled: computed(() => favoritesSearchOptions.value.sortKey === "random"),
      startsGroup: true,
      keepsOpen: true,
      onChoose: (): void => onSortAscendingChange(!favoritesSearchOptions.peek().isSortAscending)
    }
  ];
  return (
    <ChipMenu
      label="Sort"
      value={computed(() => describeSort(favoritesSearchOptions.value))}
      highlighted={computed(() => isReorderingFavoritesSearchOptions(favoritesSearchOptions.value))}
      optionMenuItems={optionMenuItems}
    />
  );
}

function describeSort({ sortKey, isSortAscending, isShuffled }: Pick<FavoritesSearchOptions, "sortKey" | "isSortAscending" | "isShuffled">): string {
  if (isShuffled) {
    return "Shuffled";
  }
  const label = SORT_LABELS[sortKey];
  return sortKey === "random" ? label : `${label} ${isSortAscending ? "↑" : "↓"}`;
}
