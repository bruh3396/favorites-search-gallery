import { TooltipVisibilityDependencies } from "@/features/tooltip/types/types";

export class TooltipVisibility {
  constructor(private readonly dependencies: TooltipVisibilityDependencies) { }

  public isEnabled(): boolean {
    const { onFavoritesPage, favoritesTooltipEnabled, postListTooltipEnabled } = this.dependencies;
    return onFavoritesPage ? favoritesTooltipEnabled() : postListTooltipEnabled();
  }
}
