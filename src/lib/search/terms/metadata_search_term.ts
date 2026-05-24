import { AbstractSearchTerm } from "./abstract_search_term";
import { Favorite } from "../../../types/favorite";
import { MetadataComparator } from "../../../types/search";
import { MetadataSearchExpression } from "../parsers/metadata_search_expression";

type Comparator = (a: number, b: number) => boolean;

const comparators: Record<MetadataComparator, Comparator> = {
  ":": (a, b) => a === b,
  ":<": (a, b) => a < b,
  ":>": (a, b) => a > b
};

export class MetadataSearchTerm extends AbstractSearchTerm {
  protected override readonly baseCost: number = 0;
  private compare: Comparator;
  private rightValue: (item: Favorite) => number;
  private leftValue: (item: Favorite) => number;

  constructor(value: string, negated: boolean, expression: MetadataSearchExpression) {
    super(value, negated);
    this.compare = comparators[expression.operator];
    this.leftValue = (item): number => item.metrics[expression.metric];
    this.rightValue = expression.hasRightHandMetric ? (item): number => item.metrics[expression.rightHandMetric] : (): number => expression.rightHandValue;
  }

  protected override matchesPositive(item: Favorite): boolean {
    return this.compare(this.leftValue(item), this.rightValue(item));
  }

  protected override matchesNegated(item: Favorite): boolean {
    return !this.compare(this.leftValue(item), this.rightValue(item));
  }
}
