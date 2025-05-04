import { Searchable, SearchableWithMetrics } from "../../../../../types/interfaces/interfaces";
import { MetadataSearchExpression } from "../../../types/metadata/favorite_metadata_search_expression";
import { SearchTag } from "./search_tag";

export class MetadataSearchTag extends SearchTag {
  private expression: MetadataSearchExpression;

  constructor(searchTag: string) {
    super(searchTag);
    this.expression = new MetadataSearchExpression(this.value);
  }

  protected get cost(): number {
    return 0;
  }

  public matches(item: Searchable): boolean {
    const { metric, operator, value } = this.getExpressionValues(item);

    switch (operator) {
      case ":":
        return metric === value;

      case ":<":
        return metric < value;

      case ":>":
        return metric > value;

      default:
        return false;
    }
  }

  private getExpressionValues(item: Searchable): {metric: number, operator: string, value: number} {
    const metricItem = item as SearchableWithMetrics;
    const metric = metricItem.metrics[this.expression.metric];
    const operator = this.expression.operator;
    const value = this.expression.hasRelativeValue ? metricItem.metrics[this.expression.relativeMetric] : this.expression.relativeValue;
    return { metric, operator, value };
  }
}
