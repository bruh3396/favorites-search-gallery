import { Metric } from "@/core/domain/search/metric";
import { Suggester } from "@/core/features/autocomplete/suggester";
import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";

const SUGGESTED_METRICS: readonly Metric[] = ["id", "score", "width", "height", "duration"];
const OPPOSITE_SIDES: Partial<Record<Metric, Metric>> = { width: "height", height: "width" };

export class MetatagSuggester implements Suggester {
  public suggest(prefix: string): readonly Suggestion[] {
    return SUGGESTED_METRICS.flatMap(listComparisons)
      .filter(metatag => metatag.startsWith(prefix) && metatag !== prefix)
      .map(text => ({ text, icon: "sliders" }));
  }
}

function listComparisons(metric: Metric): string[] {
  const oppositeSide = OPPOSITE_SIDES[metric];
  const numberComparisons = [`${metric}:>`, `${metric}:<`, `${metric}:`];

  if (oppositeSide === undefined) {
    return numberComparisons;
  }
  return [...numberComparisons, `${metric}:>${oppositeSide}`, `${metric}:<${oppositeSide}`, `${metric}:${oppositeSide}`];
}
