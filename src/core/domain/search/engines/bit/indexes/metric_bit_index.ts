import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { DensePosting } from "@/core/domain/search/engines/bit/posting/posting";
import { Metric } from "@/core/domain/search/metric";
import { MetricComparator } from "@/core/domain/search/searchable";
import { MetricComparison } from "@/core/domain/search/parsers/metric_comparison";
import { findFirstIndexWhere } from "@/core/utils/collection/array_utilities";

interface MetricAxis {
  readonly valuesByPosition: Float64Array;
  readonly positionsSortedByValue: Int32Array;
}

export class MetricBitIndex<Doc> {
  private docsByPosition: readonly Doc[] = [];
  private width = 0;
  private readonly axes = new Map<Metric, MetricAxis>();
  private readonly relativeCache = new Map<string, BitSet>();

  constructor(private readonly getMetric: (doc: Doc, metric: Metric) => number) { }

  public build(width: number, docsByPosition: readonly Doc[]): void {
    this.width = width;
    this.docsByPosition = docsByPosition;
    this.axes.clear();
    this.relativeCache.clear();
  }

  public getPosting(metricComparison: MetricComparison): DensePosting {
    const bitSet = metricComparison.isRelative ? this.relativeBitset(metricComparison) : this.absoluteBitset(metricComparison);
    return new DensePosting(bitSet);
  }

  private absoluteBitset(metricComparison: MetricComparison): BitSet {
    const metricAxis = this.getAxis(metricComparison.metric);
    const bitSet = new BitSet(this.width);
    const [start, end] = this.matchingSpan(metricAxis, metricComparison.comparator, metricComparison.value);

    for (let i = start; i < end; i += 1) {
      bitSet.set(metricAxis.positionsSortedByValue[i]);
    }
    return bitSet;
  }

  private matchingSpan(metricAxis: MetricAxis, metricComparator: MetricComparator, value: number): [number, number] {
    const { valuesByPosition, positionsSortedByValue } = metricAxis;
    const lowerBound = findFirstIndexWhere(positionsSortedByValue.length, i => valuesByPosition[positionsSortedByValue[i]] >= value);
    const upperBound = findFirstIndexWhere(positionsSortedByValue.length, i => valuesByPosition[positionsSortedByValue[i]] > value);

    switch (metricComparator) {
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

  private getAxis(metric: Metric): MetricAxis {
    const cachedMetricAxis = this.axes.get(metric);

    if (cachedMetricAxis !== undefined) {
      return cachedMetricAxis;
    }
    const valuesByPosition = new Float64Array(this.width);
    const positions = Int32Array.from(this.livePositions());

    for (const position of positions) {
      valuesByPosition[position] = this.getMetric(this.docsByPosition[position], metric);
    }
    const metricAxis: MetricAxis = {
      valuesByPosition,
      positionsSortedByValue: positions.sort((a, b) => valuesByPosition[a] - valuesByPosition[b])
    };

    this.axes.set(metric, metricAxis);
    return metricAxis;
  }

  private relativeBitset(metricComparison: MetricComparison): BitSet {
    const key = `${metricComparison.metric}${metricComparison.comparator}${metricComparison.rightHandMetric}`;
    const cachedBitSet = this.relativeCache.get(key);

    if (cachedBitSet !== undefined) {
      return cachedBitSet;
    }
    const bitSet = this.buildRelativeBitset(metricComparison);

    this.relativeCache.set(key, bitSet);
    return bitSet;
  }

  private buildRelativeBitset(metricComparison: MetricComparison): BitSet {
    const left = this.getAxis(metricComparison.metric).valuesByPosition;
    const right = this.getAxis(metricComparison.rightHandMetric).valuesByPosition;
    const matches = this.relativeComparator(metricComparison.comparator);
    const bitSet = new BitSet(this.width);

    for (const position of this.livePositions()) {
      if (matches(left[position], right[position])) {
        bitSet.set(position);
      }
    }
    return bitSet;
  }

  private relativeComparator(metricComparator: MetricComparator): (a: number, b: number) => boolean {
    switch (metricComparator) {
      case ":<": return (a, b): boolean => a < b;
      case ":>": return (a, b): boolean => a > b;
      default: return (a, b): boolean => a === b;
    }
  }
}
