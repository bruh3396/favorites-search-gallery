import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";

type FavoritesSearchPanelBody =
  | { readonly kind: "skeleton" }
  | { readonly kind: "results" }
  | { readonly kind: "empty"; readonly message: string; readonly offersClear: boolean };

interface FavoritesSearchPanelBodyInput {
  readonly resultCount: number;
  readonly isSearchable: boolean;
  readonly loadPhase: FavoritesLoadState["phase"];
  readonly isFiltered: boolean;
}

export function describeFavoritesSearchPanelBody({
  resultCount, isSearchable, loadPhase, isFiltered
}: FavoritesSearchPanelBodyInput): FavoritesSearchPanelBody {
  if (resultCount > 0) {
    return { kind: "results" };
  }

  if (isSearchable) {
    const isLoading = loadPhase !== "loaded" && loadPhase !== "interrupted";
    return { kind: "empty", message: describeNoMatches({ isFiltered, isLoading }), offersClear: isFiltered };
  }

  switch (loadPhase) {
    case "loaded": {
      return { kind: "empty", message: "No favorites yet", offersClear: false };
    }
    case "interrupted": {
      return { kind: "empty", message: "Couldn't load favorites", offersClear: false };
    }
    default: {
      return { kind: "skeleton" };
    }
  }
}

function describeNoMatches({ isFiltered, isLoading }: { isFiltered: boolean; isLoading: boolean }): string {
  if (isFiltered) {
    return isLoading ? "No matching favorites yet" : "No matching favorites";
  }
  return "No favorites yet";
}
