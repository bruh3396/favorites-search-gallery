import { brightWarmCoolHslColor, darkWarmCoolHslColor } from "../../../utils/string/color";
import { SearchQuery } from "../../../lib/search/query/search_query";
import { SearchTermHighlight } from "../types/highlight";

export function buildHighlights(query: string): SearchTermHighlight[] {
  const searchQuery = new SearchQuery(query);
  const andGroups = searchQuery.andTags.filter(t => !t.negated).map(t => [t]);
  const allTagGroups = [...andGroups, ...searchQuery.orGroups];
  const highlights: SearchTermHighlight[] = [];

  for (let i = 0; i < allTagGroups.length; i += 1) {
    highlights.push({
      tags: allTagGroups[i],
      lightColor: brightWarmCoolHslColor(i, allTagGroups.length),
      darkColor: darkWarmCoolHslColor(i, allTagGroups.length)
    });
  }
  return highlights;
}
