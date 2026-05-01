import { AbstractSearchTag } from "./abstract_search_tag";
import { Favorite } from "../../../types/favorite";
import { MetadataComparator } from "../../../types/search";
import { MetadataSearchExpression } from "../type/metadata_search_expression";

type Comparator = (a: number, b: number) => boolean;

const COMPARATORS: Record<MetadataComparator, Comparator> = {
  ":": (a, b) => a === b,
  ":<": (a, b) => a < b,
  ":>": (a, b) => a > b
};

export class MetadataSearchTag extends AbstractSearchTag {
  protected override readonly baseCost: number = 0;
  private compare: Comparator;
  private getRightValue: (item: Favorite) => number;
  private getLeftValue: (item: Favorite) => number;

  constructor(value: string, negated: boolean, expression: MetadataSearchExpression) {
    super(value, negated);
    this.compare = COMPARATORS[expression.operator];
    this.getLeftValue = (item): number => item.metrics[expression.metric];
    this.getRightValue = expression.hasRightHandMetric ? (item): number => item.metrics[expression.rightHandMetric] : (): number => expression.rightHandValue;
  }

  protected override matchesPositive(item: Favorite): boolean {
    return this.compare(this.getLeftValue(item), this.getRightValue(item));
  }

  protected override matchesNegated(item: Favorite): boolean {
    return !this.compare(this.getLeftValue(item), this.getRightValue(item));
  }
}
