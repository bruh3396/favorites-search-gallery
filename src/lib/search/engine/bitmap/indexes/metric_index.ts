import { BitSet } from "@/lib/search/engine/bitmap/bits/bitset";
import { MetricSearchComparison } from "@/lib/search/parsers/metric_search_comparison";
import { SearchableMetric } from "@/types/search";
import { findFirstIndexWhere } from "@/utils/pure/array";

interface MetricAxis {
  values: Float64Array;
  sortedPositions: Int32Array;
}

export class MetricBitmapIndex<Doc> {
  private docsByPosition: readonly (Doc | undefined)[] = [];
  private width = 0;
  private readonly axes = new Map<SearchableMetric, MetricAxis>();
  private readonly relativeCache = new Map<string, BitSet>();

  constructor(private readonly metricFor: (doc: Doc, metric: SearchableMetric) => number) { }

  public build(width: number, docsByPosition: readonly (Doc | undefined)[]): void {
    this.width = width;
    this.docsByPosition = docsByPosition;
    this.axes.clear();
    this.relativeCache.clear();
  }

  public bitsetFor(comparison: MetricSearchComparison): BitSet {
    return comparison.isRelative ? this.relativeBitset(comparison) : this.absoluteBitset(comparison);
  }

  private absoluteBitset(comparison: MetricSearchComparison): BitSet {
    const axis = this.axisFor(comparison.metric);
    const result = new BitSet(this.width);
    const [start, end] = this.matchingSpan(axis, comparison.operator, comparison.value);

    for (let i = start; i < end; i += 1) {
      result.add(axis.sortedPositions[i]);
    }
    return result;
  }

  private matchingSpan(axis: MetricAxis, operator: string, value: number): [number, number] {
    const { values, sortedPositions } = axis;
    const lowerBound = findFirstIndexWhere(sortedPositions.length, i => values[sortedPositions[i]] >= value);
    const upperBound = findFirstIndexWhere(sortedPositions.length, i => values[sortedPositions[i]] > value);

    switch (operator) {
      case ":<": return [0, lowerBound];
      case ":>": return [upperBound, sortedPositions.length];
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
    const values = new Float64Array(this.width);
    const sortedPositions = Int32Array.from(this.livePositions());

    for (const position of sortedPositions) {
      values[position] = this.metricFor(this.docsByPosition[position] as Doc, metric);
    }
    sortedPositions.sort((a, b) => values[a] - values[b]);
    const axis: MetricAxis = { values, sortedPositions };

    this.axes.set(metric, axis);
    return axis;
  }

  private relativeBitset(comparison: MetricSearchComparison): BitSet {
    const key = `${comparison.metric}${comparison.operator}${comparison.rightHandMetric}`;
    const cached = this.relativeCache.get(key);

    if (cached !== undefined) {
      return cached;
    }
    const bitset = this.buildRelativeBitset(comparison);

    this.relativeCache.set(key, bitset);
    return bitset;
  }

  private buildRelativeBitset(comparison: MetricSearchComparison): BitSet {
    const left = this.axisFor(comparison.metric).values;
    const right = this.axisFor(comparison.rightHandMetric).values;
    const matches = this.relativeComparator(comparison.operator);
    const result = new BitSet(this.width);

    for (const position of this.livePositions()) {
      if (matches(left[position], right[position])) {
        result.add(position);
      }
    }
    return result;
  }

  private relativeComparator(operator: string): (a: number, b: number) => boolean {
    switch (operator) {
      case ":<": return (a, b): boolean => a < b;
      case ":>": return (a, b): boolean => a > b;
      default: return (a, b): boolean => a === b;
    }
  }
}
