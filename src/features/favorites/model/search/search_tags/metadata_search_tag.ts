import { Favorite } from "../../../../../types/favorite_types";
import { FavoriteMetadataSearchExpression } from "../../../types/metadata/favorite_metadata_search_expression";
import { SearchTag } from "./search_tag";
import { Searchable } from "../../../../../types/common_types";

export class MetadataSearchTag extends SearchTag {
  private expression: FavoriteMetadataSearchExpression;

  constructor(searchTag: string) {
    super(searchTag);
    this.expression = new FavoriteMetadataSearchExpression(this.value);
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

  private getExpressionValues(item: Searchable): { metric: number, operator: string, value: number } {
    const metricItem = item as Favorite;
    const metric = metricItem.metrics[this.expression.metric];
    const operator = this.expression.operator;
    const value = this.expression.hasRightHandMetric ? metricItem.metrics[this.expression.rightHandMetric] : this.expression.rightHandValue;
    return { metric, operator, value };
  }
}
