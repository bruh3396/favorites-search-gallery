import * as TooltipHighlightBuilder from "@/features/tooltip/model/highlight_builder";
import * as TooltipTagMatcher from "@/features/tooltip/model/tag_matcher";
import { SearchTermHighlight } from "@/features/tooltip/types/highlight";
import { TooltipHighlightsDependencies } from "@/features/tooltip/types/types";

export class TooltipHighlights {
  private current: SearchTermHighlight[] = [];

  constructor(private readonly dependencies: TooltipHighlightsDependencies) { }

  public rebuild(query: string): void {
    this.current = TooltipHighlightBuilder.buildHighlights(query);
  }

  public colorForTag(tag: string): string | null {
    if (this.dependencies.usingDarkMode()) {
      return TooltipTagMatcher.findMatchingLightColor(tag, this.current);
    }
    return TooltipTagMatcher.findMatchingDarkColor(tag, this.current);
  }
}
