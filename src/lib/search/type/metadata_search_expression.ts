import { MetadataComparator, SearchableMetadataMetric } from "../../../types/search";
import { SEARCHABLE_METADATA_METRICS, isMetadataComparator, isSearchableMetadataMetric } from "../../../types/guards";

const METRIC_PATTERN = Array.from(SEARCHABLE_METADATA_METRICS).join("|");

export class MetadataSearchExpression {
  public static regex: RegExp = new RegExp(`^-?(${METRIC_PATTERN})(:[<>]?)(\\d+|${METRIC_PATTERN})$`);
  public readonly metric: SearchableMetadataMetric;
  public readonly operator: MetadataComparator;
  public readonly hasRightHandMetric: boolean;
  public readonly rightHandMetric: SearchableMetadataMetric;
  public readonly rightHandValue: number;

  constructor(searchTag: string) {
    const extractedExpression = this.extractExpression(searchTag);
    const value = extractedExpression.value;

    this.metric = extractedExpression.metric;
    this.operator = extractedExpression.operator;

    if (isSearchableMetadataMetric(value)) {
      this.hasRightHandMetric = true;
      this.rightHandMetric = value;
      this.rightHandValue = 0;
    } else {
      this.hasRightHandMetric = false;
      this.rightHandMetric = "id";
      this.rightHandValue = value;
    }
  }

  private extractExpression(searchTag: string): { metric: SearchableMetadataMetric; operator: MetadataComparator; value: SearchableMetadataMetric | number } {
    const extractedExpression = MetadataSearchExpression.regex.exec(searchTag);

    if (extractedExpression === null || extractedExpression.length !== 4) {
      return {
        metric: "width",
        operator: ":",
        value: 0
      };
    }
    const metric = isSearchableMetadataMetric(extractedExpression[1]) ? extractedExpression[1] : "id";
    const operator = isMetadataComparator(extractedExpression[2]) ? extractedExpression[2] : ":";
    const value = isSearchableMetadataMetric(extractedExpression[3]) ? extractedExpression[3] : Number(extractedExpression[3]);
    return {
      metric,
      operator,
      value
    };
  }
}
