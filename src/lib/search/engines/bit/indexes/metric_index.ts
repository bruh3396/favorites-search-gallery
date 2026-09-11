import { MetricComparator, SearchableMetric } from "@/types/search";
import { BitSet } from "@/lib/search/engines/bit/postings/bitset";
import { DensePosting } from "@/lib/search/engines/bit/postings/posting";
import { MetricComparison } from "@/lib/search/parsers/metric_comparison";
import { findFirstIndexWhere } from "@/utils/pure/array";

interface MetricAxis {
  valuesByPosition: Float64Array;
  positionsSortedByValue: Int32Array;
}

export class MetricBitIndex<Doc> {
  private docsByPosition: readonly Doc[] = [];
  private width = 0;
  private readonly axes = new Map<SearchableMetric, MetricAxis>();
  private readonly relativeCache = new Map<string, BitSet>();

  constructor(private readonly metricFor: (doc: Doc, metric: SearchableMetric) => number) { }

  public build(width: number, docsByPosition: readonly Doc[]): void {
    this.width = width;
    this.docsByPosition = docsByPosition;
    this.axes.clear();
    this.relativeCache.clear();
  }

  public postingFor(comparison: MetricComparison): DensePosting {
    const bitSet = comparison.isRelative ? this.relativeBitset(comparison) : this.absoluteBitset(comparison);
    return new DensePosting(bitSet);
  }

  private absoluteBitset(comparison: MetricComparison): BitSet {
    const axis = this.axisFor(comparison.metric);
    const result = new BitSet(this.width);
    const [start, end] = this.matchingSpan(axis, comparison.operator, comparison.value);

    for (let i = start; i < end; i += 1) {
      result.set(axis.positionsSortedByValue[i]);
    }
    return result;
  }

  private matchingSpan(axis: MetricAxis, operator: MetricComparator, value: number): [number, number] {
    const { valuesByPosition, positionsSortedByValue } = axis;
    const lowerBound = findFirstIndexWhere(positionsSortedByValue.length, i => valuesByPosition[positionsSortedByValue[i]] >= value);
    const upperBound = findFirstIndexWhere(positionsSortedByValue.length, i => valuesByPosition[positionsSortedByValue[i]] > value);

    switch (operator) {
      case ":<": return [0, lowerBound];
      case ":>": return [upperBound, positionsSortedByValue.length];
      default: return [lowerBound, upperBound];
    }
  }

  private livePositions(): number[] {
    const positions: number[] = [];

    for (let position = 0; position < this.docsByPosition.length; position += 1) {
      if (this.docsByPosition[position] !== undefined) {
        positions.push(position);
      }
    }
    return positions;
  }

  private axisFor(metric: SearchableMetric): MetricAxis {
    const cached = this.axes.get(metric);

    if (cached !== undefined) {
      return cached;
    }
    const valuesByPosition = new Float64Array(this.width);
    const positions = Int32Array.from(this.livePositions());

    for (const position of positions) {
      valuesByPosition[position] = this.metricFor(this.docsByPosition[position], metric);
    }
    const axis: MetricAxis = {
      valuesByPosition,
      positionsSortedByValue: positions.sort((a, b) => valuesByPosition[a] - valuesByPosition[b])
    };

    this.axes.set(metric, axis);
    return axis;
  }

  private relativeBitset(comparison: MetricComparison): BitSet {
    const key = `${comparison.metric}${comparison.operator}${comparison.rightHandMetric}`;
    const cached = this.relativeCache.get(key);

    if (cached !== undefined) {
      return cached;
    }
    const bitset = this.buildRelativeBitset(comparison);

    this.relativeCache.set(key, bitset);
    return bitset;
  }

  private buildRelativeBitset(comparison: MetricComparison): BitSet {
    const left = this.axisFor(comparison.metric).valuesByPosition;
    const right = this.axisFor(comparison.rightHandMetric).valuesByPosition;
    const matches = this.relativeComparator(comparison.operator);
    const result = new BitSet(this.width);

    for (const position of this.livePositions()) {
      if (matches(left[position], right[position])) {
        result.set(position);
      }
    }
    return result;
  }

  private relativeComparator(operator: MetricComparator): (a: number, b: number) => boolean {
    switch (operator) {
      case ":<": return (a, b): boolean => a < b;
      case ":>": return (a, b): boolean => a > b;
      default: return (a, b): boolean => a === b;
    }
  }
}
