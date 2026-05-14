import * as TooltipHighlightPalette from "./highlight_palette";
import * as TooltipSearchTermParser from "./search_term_parser";
import * as TooltipTagMatcher from "./tag_matcher";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { Preferences } from "../../../lib/preferences/preferences";
import { SearchTermHighlight } from "../types/highlight";

let currentHighlights: SearchTermHighlight[] = [];

export function rebuildHighlights(query: string): void {
  currentHighlights = TooltipSearchTermParser.parseSearchQueryIntoHighlights(query);
  TooltipHighlightPalette.assignColorsByIndex(currentHighlights);
}

export function getColorForTag(tag: string): string | null {
  return TooltipTagMatcher.findMatchingTermColor(tag, currentHighlights);
}

export function tooltipEnabled(): boolean {
  return ON_FAVORITES_PAGE ? Preferences.tooltipEnabled.value : Preferences.searchPageTooltipEnabled.value;
}
