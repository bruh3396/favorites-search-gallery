import * as TooltipHighlightBuilder from "./highlight_builder";
import * as TooltipTagMatcher from "./tag_matcher";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { Preferences } from "../../../app/context/preferences";
import { SearchTermHighlight } from "../types/highlight";
import { usingDarkTheme } from "../../../lib/ui/style";

let currentHighlights: SearchTermHighlight[] = [];

export function rebuildHighlights(query: string): void {
  currentHighlights = TooltipHighlightBuilder.buildHighlights(query);
}

export function getColorForTag(tag: string): string | null {
  if (usingDarkTheme()) {
    return TooltipTagMatcher.findMatchingLightColor(tag, currentHighlights);
  }
  return TooltipTagMatcher.findMatchingDarkColor(tag, currentHighlights);
}

export function tooltipEnabled(): boolean {
  return ON_FAVORITES_PAGE ? Preferences.tooltipEnabled.value : Preferences.searchPageTooltipEnabled.value;
}
