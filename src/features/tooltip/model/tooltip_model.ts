import * as TooltipHighlightBuilder from "@/features/tooltip/model/highlight_builder";
import * as TooltipTagMatcher from "@/features/tooltip/model/tag_matcher";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { SearchTermHighlight } from "@/features/tooltip/types/highlight";
let currentHighlights: SearchTermHighlight[] = [];

export function rebuildHighlights(query: string): void {
  currentHighlights = TooltipHighlightBuilder.buildHighlights(query);
}

export function getColorForTag(tag: string): string | null {
  if (Preferences.app.theme.value === "native-light") {
    return TooltipTagMatcher.findMatchingDarkColor(tag, currentHighlights);
  }
  return TooltipTagMatcher.findMatchingLightColor(tag, currentHighlights);
}

export function tooltipEnabled(): boolean {
  return ON_FAVORITES_PAGE ? Preferences.favorites.tooltipEnabled.value : Preferences.postList.tooltipEnabled.value;
}
