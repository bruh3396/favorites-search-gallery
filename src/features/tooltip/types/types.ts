export interface TooltipHighlightsDependencies {
  usingDarkMode: () => boolean;
}

export interface TooltipVisibilityDependencies {
  onFavoritesPage: boolean;
  favoritesTooltipEnabled: () => boolean;
  postListTooltipEnabled: () => boolean;
}
