import { SearchQuery } from "@/lib/search/query/search_query";
import { SearchTermHighlight } from "@/features/tooltip/types/highlight";

export function buildHighlights(query: string): SearchTermHighlight[] {
  const searchQuery = new SearchQuery(query);
  const andGroups = searchQuery.andTerms.filter(term => !term.isNegated).map(t => [t]);
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

function brightWarmCoolHslColor(index: number, total: number): string {
  return warmCoolHslColor(index, total, 75, 70);
}

function darkWarmCoolHslColor(index: number, total: number): string {
  return warmCoolHslColor(index, total, 75, 45);
}

function warmCoolHslColor(index: number, total: number, saturation = 90, lightness = 70): string {
  const half = Math.max(total, 1) / 2;
  const fractionOfHalf = index / half;
  const inFirstHalf = index < half;
  const warmHue = Math.round(fractionOfHalf * 80);
  const coolHue = Math.round(200 + ((fractionOfHalf - 1) * 140));
  const hue = inFirstHalf ? warmHue : coolHue;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
