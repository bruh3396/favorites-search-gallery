import { FavoritesLoadStatePhase } from "@/core/features/favorites/load/favorites_load_state";

export type FavoritesSearchPanelBody =
  | { readonly kind: "skeleton" }
  | { readonly kind: "results" }
  | { readonly kind: "empty"; readonly message: string; readonly offersClear: boolean };

export interface FavoritesSearchPanelBodyInput {
  readonly resultCount: number;
  readonly isSearchable: boolean;
  readonly loadPhase: FavoritesLoadStatePhase;
  readonly query: string;
  readonly isFiltered: boolean;
}

export function describeFavoritesSearchPanelBody({
  resultCount, isSearchable, loadPhase, query, isFiltered
}: FavoritesSearchPanelBodyInput): FavoritesSearchPanelBody {
  if (resultCount > 0) {
    return { kind: "results" };
  }

  if (isSearchable) {
    const isLoading = loadPhase !== "loaded" && loadPhase !== "interrupted";
    return { kind: "empty", message: describeNoMatches(query, { isFiltered, isLoading }), offersClear: isFiltered };
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

function describeNoMatches(query: string, { isFiltered, isLoading }: { isFiltered: boolean; isLoading: boolean }): string {
  const suffix = isLoading ? " yet" : "";

  if (query !== "") {
    return `No favorites match "${query}"${suffix}`;
  }

  if (isFiltered) {
    return `No favorites match these filters${suffix}`;
  }
  return "No favorites yet";
}
