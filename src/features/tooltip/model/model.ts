import * as TooltipHighlightBuilder from "@/features/tooltip/model/highlight_builder";
import * as TooltipTagMatcher from "@/features/tooltip/model/tag_matcher";
import { AppContext } from "@/app/context/context";
import { SearchTermHighlight } from "@/features/tooltip/types/highlight";

export class TooltipModel {
  private currentHighlights: SearchTermHighlight[] = [];

  constructor(private readonly context: AppContext) { }

  public rebuildHighlights(query: string): void {
    this.currentHighlights = TooltipHighlightBuilder.buildHighlights(query);
  }

  public colorForTag(tag: string): string | null {
    if (!this.context.preferences.app.darkMode.value) {
      return TooltipTagMatcher.findMatchingDarkColor(tag, this.currentHighlights);
    }
    return TooltipTagMatcher.findMatchingLightColor(tag, this.currentHighlights);
  }

  public tooltipEnabled(): boolean {
    const { environment, preferences } = this.context;

    return environment.onFavoritesPage ? preferences.favorites.tooltipEnabled.value : preferences.postList.tooltipEnabled.value;
  }
}
