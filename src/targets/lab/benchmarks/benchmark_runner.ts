import { BitSearchEngine } from "@/core/domain/search/engines/bit/bit_search_engine";
import { MetricSearchable } from "@/core/domain/search/metric_searchable";
import { SearchEngineDependencies } from "@/core/domain/search/engines/search_engine";
import { SetSearchEngine } from "@/core/domain/search/engines/set/set_search_engine";
import { StringInterner } from "@/core/utils/string/string_interner";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";
import { parseSearchQuery } from "@/core/domain/search/parsers/search_query_parser";

type BenchmarkEngine = "bit" | "set" | "linear";

interface BenchmarkMeasurement {
  readonly times: Partial<Record<BenchmarkEngine, number>>;
  readonly totalTimes: Partial<Record<BenchmarkEngine, number>>;
  readonly matchCount: number;
  readonly mismatchedBenchmarkEngines: readonly BenchmarkEngine[];
}

const SAMPLE_COUNT = 5;
const BATCH_MILLISECONDS = 10;

function createSearchEngineDependencies(): SearchEngineDependencies<MetricSearchable> {
  return {
    getTerms: metricSearchable => metricSearchable.tags,
    getMetric: (metricSearchable, metric) => metricSearchable.getMetric(metric),
    stringInterner: new StringInterner()
  };
}

export class BenchmarkRunner {
  public readonly buildTimes: Readonly<Record<Exclude<BenchmarkEngine, "linear">, number>>;
  private readonly bitSearchEngine: BitSearchEngine<MetricSearchable>;
  private readonly setSearchEngine: SetSearchEngine<MetricSearchable>;

  constructor(private readonly metricSearchables: MetricSearchable[]) {
    const bitStart = performance.now();

    this.bitSearchEngine = new BitSearchEngine(createSearchEngineDependencies(), metricSearchables);
    const setStart = performance.now();

    this.setSearchEngine = new SetSearchEngine(createSearchEngineDependencies(), metricSearchables);
    this.buildTimes = { bit: setStart - bitStart, set: performance.now() - setStart };
  }

  public measure(query: string, benchmarkEngines: readonly BenchmarkEngine[]): BenchmarkMeasurement {
    const searchExpression = parseSearchExpression(query);
    const runnableBenchmarkEngines = benchmarkEngines.filter(benchmarkEngine => benchmarkEngine !== "linear" || !isNested(query));
    const searches: Record<BenchmarkEngine, () => readonly MetricSearchable[]> = {
      bit: () => this.bitSearchEngine.search(searchExpression),
      set: () => this.setSearchEngine.search(searchExpression),
      linear: () => []
    };

    if (runnableBenchmarkEngines.includes("linear")) {
      const searchQuery = parseSearchQuery<MetricSearchable>(query);

      searches.linear = (): readonly MetricSearchable[] => searchQuery.filter(this.metricSearchables);
    }
    const matches = runnableBenchmarkEngines.map(benchmarkEngine => searches[benchmarkEngine]());
    const referenceDocs = new Set(matches[0]);
    const samples = runnableBenchmarkEngines.map((): number[] => []);
    const totalTimes = runnableBenchmarkEngines.map(() => 0);

    for (let round = 0; round < SAMPLE_COUNT; round += 1) {
      runnableBenchmarkEngines.forEach((benchmarkEngine, index) => {
        const { elapsed, repetitions } = timeBatch(searches[benchmarkEngine]);

        samples[index].push(elapsed / repetitions);
        totalTimes[index] += elapsed;
      });
    }
    return {
      times: Object.fromEntries(runnableBenchmarkEngines.map((benchmarkEngine, index) => [benchmarkEngine, median(samples[index])])),
      totalTimes: Object.fromEntries(runnableBenchmarkEngines.map((benchmarkEngine, index) => [benchmarkEngine, totalTimes[index]])),
      matchCount: referenceDocs.size,
      mismatchedBenchmarkEngines: runnableBenchmarkEngines.filter((_, index) => !isSameDocs(matches[index], referenceDocs))
    };
  }
}

function timeBatch(search: () => unknown): { elapsed: number; repetitions: number } {
  const start = performance.now();
  let repetitions = 0;
  let elapsed: number;

  do {
    search();
    repetitions += 1;
    elapsed = performance.now() - start;
  } while (elapsed < BATCH_MILLISECONDS);
  return { elapsed, repetitions };
}

function median(values: readonly number[]): number {
  return values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];
}

function isSameDocs(metricSearchables: readonly MetricSearchable[], referenceDocs: ReadonlySet<MetricSearchable>): boolean {
  return metricSearchables.length === referenceDocs.size && metricSearchables.every(metricSearchable => referenceDocs.has(metricSearchable));
}

function isNested(query: string): boolean {
  let depth = 0;

  for (const token of query.split(/\s+/)) {
    depth += token === "(" ? 1 : token === ")" ? -1 : 0;

    if (depth > 1) {
      return true;
    }
  }
  return false;
}
