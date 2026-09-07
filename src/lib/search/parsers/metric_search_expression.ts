import { MetricComparator, SearchableMetric } from "@/types/search";
import { isMetadataComparator, isSearchableMetadataMetric, searchableMetrics } from "@/types/guards";

const metricPattern = Array.from(searchableMetrics).join("|");

export class MetricSearchExpression {
  public static regex: RegExp = new RegExp(`^-?(${metricPattern})(:[<>]?)(\\d+|${metricPattern})$`);
  public readonly metric: SearchableMetric;
  public readonly operator: MetricComparator;
  public readonly hasRightHandMetric: boolean;
  public readonly rightHandMetric: SearchableMetric;
  public readonly rightHandValue: number;

  constructor(term: string) {
    const extractedExpression = this.parseExpression(term);
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

  private parseExpression(term: string): { metric: SearchableMetric; operator: MetricComparator; value: SearchableMetric | number } {
    const extractedExpression = MetricSearchExpression.regex.exec(term);

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
