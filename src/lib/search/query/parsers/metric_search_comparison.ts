import { MetricComparator, SearchableMetric } from "@/types/search";
import { isMetadataComparator, isSearchableMetadataMetric, searchableMetrics } from "@/types/guards";

const metricPattern = Array.from(searchableMetrics).join("|");

export class MetricSearchComparison {
  public static regex: RegExp = new RegExp(`^-?(${metricPattern})(:[<>]?)(\\d+|${metricPattern})$`);
  public readonly metric: SearchableMetric;
  public readonly operator: MetricComparator;
  public readonly isRelative: boolean;
  public readonly rightHandMetric: SearchableMetric;
  public readonly value: number;
  public readonly isTautological: boolean;

  constructor(term: string) {
    const extractedExpression = this.parseExpression(term);
    const value = extractedExpression.value;

    this.metric = extractedExpression.metric;
    this.operator = extractedExpression.operator;

    if (isSearchableMetadataMetric(value)) {
      this.isRelative = true;
      this.rightHandMetric = value;
      this.value = 0;
    } else {
      this.isRelative = false;
      this.rightHandMetric = "id";
      this.value = value;
    }
    this.isTautological = this.isRelative && this.metric === this.rightHandMetric;
  }

  private parseExpression(term: string): { metric: SearchableMetric; operator: MetricComparator; value: SearchableMetric | number } {
    const extractedExpression = MetricSearchComparison.regex.exec(term);

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
