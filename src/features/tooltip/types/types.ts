import { ColorScheme } from "@/core/boundary/environment";

export interface TooltipHighlightsDependencies {
  colorScheme: () => ColorScheme;
}

export interface TooltipVisibilityDependencies {
  onFavoritesPage: boolean;
  favoritesTooltipEnabled: () => boolean;
  postListTooltipEnabled: () => boolean;
}
