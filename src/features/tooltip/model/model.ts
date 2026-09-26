import { AppContext } from "@/app/context/context";
import { TooltipHighlights } from "@/features/tooltip/model/highlights";
import { TooltipVisibility } from "@/features/tooltip/model/visibility";

export class TooltipModel {
  private readonly highlights: TooltipHighlights;
  private readonly visibility: TooltipVisibility;

  constructor(context: AppContext) {
    const { environment, preferences } = context;

    this.highlights = new TooltipHighlights({
      usingDarkMode: (): boolean => preferences.app.darkMode.value
    });
    this.visibility = new TooltipVisibility({
      onFavoritesPage: environment.onFavoritesPage,
      favoritesTooltipEnabled: (): boolean => preferences.favorites.tooltipEnabled.value,
      postListTooltipEnabled: (): boolean => preferences.postList.tooltipEnabled.value
    });
  }

  public rebuildHighlights(query: string): void {
    this.highlights.rebuild(query);
  }

  public colorForTag(tag: string): string | null {
    return this.highlights.colorForTag(tag);
  }

  public tooltipEnabled(): boolean {
    return this.visibility.isEnabled();
  }
}
