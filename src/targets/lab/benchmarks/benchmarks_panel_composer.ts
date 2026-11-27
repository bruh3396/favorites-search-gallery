import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { Signal, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { BenchmarkRunner } from "@/targets/lab/benchmarks/benchmark_runner";
import { Button } from "@/core/ui/components/button/button";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { LabCard } from "@/targets/lab/components/card/lab_card";
import { LabRow } from "@/targets/lab/components/row/lab_row";
import { Metric } from "@/core/domain/search/metric";
import { MetricSearchable } from "@/core/domain/search/metric_searchable";
import { Post } from "@/core/domain/post/post";
import { Progress } from "@/core/ui/components/progress_line/progress";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TextFieldClass } from "@/core/ui/components/text_field/text_field";
import { createBenchmarkCases } from "@/targets/lab/benchmarks/benchmark_cases";
import { h } from "@/core/ui/h/h";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

type BenchmarkCase = ReturnType<typeof createBenchmarkCases>[number];
type BenchmarkMeasurement = ReturnType<BenchmarkRunner["measure"]>;
type BenchmarkEngine = Parameters<BenchmarkRunner["measure"]>[1][number];

interface SizeResult {
  readonly buildTimes: BenchmarkRunner["buildTimes"];
  readonly benchmarkCases: readonly BenchmarkCase[];
  readonly measurements: Map<string, BenchmarkMeasurement>;
  readonly totalTimes: Record<BenchmarkEngine, number>;
}

export interface BenchmarksPanelComposerDependencies {
  indexedDbClient: Pick<IndexedDbClient, "runTransaction">;
}

const BenchmarksPanelClass = {
  root: "fsg-BenchmarksPanel",
  race: "fsg-BenchmarksPanel-race",
  table: "fsg-BenchmarksPanel-table",
  group: "fsg-BenchmarksPanel-group",
  case: "fsg-BenchmarksPanel-case",
  engine: "fsg-BenchmarksPanel-engine",
  muted: "fsg-BenchmarksPanel-muted",
  slower: "fsg-BenchmarksPanel-slower",
  mismatch: "fsg-BenchmarksPanel-mismatch",
  tool: "fsg-BenchmarksPanel-tool"
} as const;

const SIZES = [1_000, 10_000, 100_000, 250_000];
const BENCHMARK_ENGINES: readonly BenchmarkEngine[] = ["bit", "set", "linear"];
const ENGINE_NAMES: Readonly<Record<BenchmarkEngine, string>> = { bit: "Bit", set: "Set", linear: "Linear" };
const MAX_SIZE = Math.max(...SIZES);
const LIMIT_MILLISECONDS = 10_000;
const CHUNK_SIZE = 10_000;

export function composeBenchmarksPanel({ indexedDbClient }: BenchmarksPanelComposerDependencies): () => HTMLElement {
  const selectedSize = new Signal(100_000);
  const benchmarkProgress = new Signal<Progress>("idle");
  const busy = computed(() => benchmarkProgress.value !== "idle");
  const revision = new Signal(0);
  const measured = new Signal(false);
  const sizeResults = new Map<number, SizeResult>();
  const racedBenchmarkCases: BenchmarkCase[] = [];
  let loadingMetricSearchables: Promise<MetricSearchable[]> | null = null;
  let current: { size: number; benchmarkRunner: BenchmarkRunner } | null = null;
  let isCancelled = false;
  const refresh = (): void => {
    revision.value += 1;
  };
  const loadMetricSearchables = (): Promise<MetricSearchable[]> => {
    loadingMetricSearchables ??= readMetricSearchables(indexedDbClient, fraction => {
      benchmarkProgress.value = fraction;
    });
    return loadingMetricSearchables;
  };
  const buildRunner = async(size: number): Promise<BenchmarkRunner> => {
    const metricSearchables = await loadMetricSearchables();

    if (current?.size !== size) {
      current = { size, benchmarkRunner: new BenchmarkRunner(metricSearchables.slice(0, size)) };
    }
    return current.benchmarkRunner;
  };
  const measureCase = (sizeResult: SizeResult, benchmarkRunner: BenchmarkRunner, benchmarkCase: BenchmarkCase): void => {
    const benchmarkEngines = BENCHMARK_ENGINES.filter(benchmarkEngine => sizeResult.totalTimes[benchmarkEngine] <= LIMIT_MILLISECONDS);
    const benchmarkMeasurement = benchmarkRunner.measure(benchmarkCase.query, benchmarkEngines);

    for (const benchmarkEngine of benchmarkEngines) {
      sizeResult.totalTimes[benchmarkEngine] += benchmarkMeasurement.totalTimes[benchmarkEngine] ?? 0;
    }
    sizeResult.measurements.set(benchmarkCase.name, benchmarkMeasurement);
    refresh();
  };
  const runAll = async(): Promise<void> => {
    const metricSearchables = await loadMetricSearchables();

    sizeResults.clear();
    measured.value = false;
    refresh();

    for (const [sizeIndex, size] of SIZES.entries()) {
      await yieldToBrowser();
      const benchmarkRunner = await buildRunner(size);
      const { buildTimes } = benchmarkRunner;
      const sizeResult: SizeResult = {
        buildTimes,
        benchmarkCases: createBenchmarkCases(metricSearchables.slice(0, size)),
        measurements: new Map(),
        totalTimes: { ...buildTimes, linear: 0 }
      };
      const benchmarkCases = [...racedBenchmarkCases, ...sizeResult.benchmarkCases];

      sizeResults.set(size, sizeResult);
      measured.value = true;

      for (const [caseIndex, benchmarkCase] of benchmarkCases.entries()) {
        if (isCancelled) {
          return;
        }
        measureCase(sizeResult, benchmarkRunner, benchmarkCase);
        benchmarkProgress.value = (sizeIndex + ((caseIndex + 1) / benchmarkCases.length)) / SIZES.length;
        await yieldToBrowser();
      }
    }
  };
  const runTask = (task: () => Promise<void>): void => {
    isCancelled = false;
    benchmarkProgress.value = "indeterminate";
    task().catch(reportError).finally(() => {
      benchmarkProgress.value = "idle";
    });
  };
  const rerun = (benchmarkCase: BenchmarkCase): void => {
    const size = selectedSize.peek();
    const sizeResult = sizeResults.get(size);

    if (sizeResult !== undefined) {
      runTask(async() => {
        const benchmarkRunner = await buildRunner(size);

        sizeResult.measurements.set(benchmarkCase.name, benchmarkRunner.measure(benchmarkCase.query, BENCHMARK_ENGINES));
        refresh();
      });
    }
  };
  const race = (raceInput: HTMLInputElement): void => {
    const query = raceInput.value.trim();

    try {
      parseSearchExpression(query);
    } catch {
      return;
    }
    const benchmarkCase: BenchmarkCase = { group: "Race", name: `Race ${racedBenchmarkCases.length + 1}`, query };

    racedBenchmarkCases.unshift(benchmarkCase);
    raceInput.value = "";
    refresh();
    rerun(benchmarkCase);
  };
  const exportResults = (): void => {
    const report = {
      userAgent: navigator.userAgent,
      date: new Date().toISOString(),
      sizes: [...sizeResults].map(([size, sizeResult]) => ({
        size,
        buildTimes: sizeResult.buildTimes,
        cases: [...racedBenchmarkCases, ...sizeResult.benchmarkCases].map(benchmarkCase => ({
          ...benchmarkCase,
          ...sizeResult.measurements.get(benchmarkCase.name)
        }))
      }))
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "fsg-lab-benchmarks.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url));
  };
  const renderTimeCell = (benchmarkEngine: BenchmarkEngine, sizeResult: SizeResult, benchmarkMeasurement: BenchmarkMeasurement): HTMLElement => {
    const time = benchmarkMeasurement.times[benchmarkEngine];
    const bitTime = benchmarkMeasurement.times.bit;

    if (time === undefined) {
      return h("td", { className: BenchmarksPanelClass.muted }, sizeResult.totalTimes[benchmarkEngine] > LIMIT_MILLISECONDS ? "> 10 s" : "—");
    }

    if (benchmarkEngine === "bit" || bitTime === undefined) {
      return h("td", null, formatTime(time));
    }
    const ratio = time / bitTime;
    return h("td", { className: ratio < 1 ? BenchmarksPanelClass.slower : "", title: formatTime(time) }, formatRatio(ratio));
  };
  const renderCaseRow = (benchmarkCase: BenchmarkCase, sizeResult: SizeResult | undefined): HTMLElement => {
    const benchmarkMeasurement = sizeResult?.measurements.get(benchmarkCase.name);
    let resultCells: HTMLElement[] = [...BENCHMARK_ENGINES, "matches"].map(() => h("td", { className: BenchmarksPanelClass.muted }, "—"));

    if (sizeResult !== undefined && benchmarkMeasurement !== undefined) {
      resultCells = [
        ...BENCHMARK_ENGINES.map(benchmarkEngine => renderTimeCell(benchmarkEngine, sizeResult, benchmarkMeasurement)),
        renderMatchCell(benchmarkMeasurement)
      ];
    }
    return h(
      "tr",
      null,
      h("td", null, h("span", { className: BenchmarksPanelClass.case }, benchmarkCase.name, h("code", null, benchmarkCase.query))),
      resultCells,
      h("td", { className: BenchmarksPanelClass.tool }, h(IconButton, {
        icon: "rotateCcw",
        label: "Rerun",
        disabled: computed(() => busy.value || sizeResult === undefined),
        onClick: () => rerun(benchmarkCase)
      }))
    );
  };
  const renderTableBody = (size: number): HTMLElement => {
    const sizeResult = sizeResults.get(size);
    const rows: HTMLElement[] = [];
    let group = "";

    for (const benchmarkCase of [...racedBenchmarkCases, ...sizeResult?.benchmarkCases ?? []]) {
      if (benchmarkCase.group !== group) {
        group = benchmarkCase.group;
        rows.push(h("tr", { className: BenchmarksPanelClass.group }, h("th", { colSpan: BENCHMARK_ENGINES.length + 3 }, group)));
      }
      rows.push(renderCaseRow(benchmarkCase, sizeResult));
    }
    return h("tbody", null, rows);
  };
  return () => {
    const createTableBodyScope = captureScope();
    const engineHeaders = BENCHMARK_ENGINES.map(benchmarkEngine => h(
      "th",
      null,
      h("span", { className: BenchmarksPanelClass.engine, dataset: { engine: benchmarkEngine } }, ENGINE_NAMES[benchmarkEngine])
    ));
    const tableHead = h(
      "thead",
      null,
      h("tr", null, h("th", null), engineHeaders, h("th", null, "Matches"), h("th", { className: BenchmarksPanelClass.tool }))
    );
    const table = h("table", { className: BenchmarksPanelClass.table });
    const raceInput = h("input", {
      className: `${TextFieldClass.input} ${BenchmarksPanelClass.race}`,
      type: "text",
      placeholder: "Query",
      "aria-label": "Query",
      spellcheck: false,
      onKeydown: event => {
        if (event.key === "Enter") {
          race(raceInput);
        }
      }
    });
    let tableBody: Scoped<HTMLElement> | null = null;

    effect(() => {
      const size = selectedSize.value;

      void revision.value;
      tableBody?.dispose();
      tableBody = createTableBodyScope(() => untracked(() => renderTableBody(size)));
      table.replaceChildren(tableHead, tableBody.result);
    });
    onCleanup(() => tableBody?.dispose());
    return h(
      "div",
      { className: BenchmarksPanelClass.root },
      h(LabCard, {
        children: h(LabRow, {
          name: "Size",
          controlsChild: h(Segmented<number>, {
            controlChoices: SIZES.map(size => ({ value: size, label: formatSize(size) })),
            value: selectedSize,
            onValueChange: (size): void => {
              selectedSize.value = size;
            }
          }),
          actionsChild: [
            h(Button, { label: "Export", disabled: computed(() => busy.value || !measured.value), onClick: exportResults }),
            h(Button, {
              label: computed(() => (busy.value ? "Cancel" : "Run")),
              emphasis: "filled",
              onClick: (): void => {
                if (busy.peek()) {
                  isCancelled = true;
                } else {
                  runTask(runAll);
                }
              }
            })
          ],
          progressChild: h(ProgressLine, { label: "Benchmarks", progress: benchmarkProgress })
        })
      }),
      h(LabCard, {
        children: [
          h(LabRow, {
            name: "Race",
            controlsChild: raceInput,
            actionsChild: h(Button, { label: "Race", disabled: busy, onClick: () => race(raceInput) })
          }),
          table
        ]
      })
    );
  };
}

function renderMatchCell({ matchCount, mismatchedBenchmarkEngines }: BenchmarkMeasurement): HTMLElement {
  if (mismatchedBenchmarkEngines.length === 0) {
    return h("td", null, matchCount.toLocaleString());
  }
  const title = mismatchedBenchmarkEngines.map(benchmarkEngine => ENGINE_NAMES[benchmarkEngine]).join(", ");
  return h("td", { className: BenchmarksPanelClass.mismatch, title }, `≠ ${matchCount.toLocaleString()}`);
}

async function readMetricSearchables(
  indexedDbClient: BenchmarksPanelComposerDependencies["indexedDbClient"],
  onProgress: (fraction: number) => void
): Promise<MetricSearchable[]> {
  const stringInterner = new StringInterner();
  const metricSearchables: MetricSearchable[] = [];
  let keyRange: IDBKeyRange | null = null;

  while (metricSearchables.length < MAX_SIZE) {
    const count = Math.min(CHUNK_SIZE, MAX_SIZE - metricSearchables.length);
    const currentKeyRange = keyRange;
    const request = await indexedDbClient.runTransaction("posts", "readonly", store => store.getAll(currentKeyRange, count) as IDBRequest<Post[]>);
    const lastPost = request.result.at(-1);

    if (lastPost === undefined) {
      break;
    }

    for (const post of request.result) {
      metricSearchables.push(createMetricSearchable(post, stringInterner));
    }
    keyRange = IDBKeyRange.lowerBound(lastPost.id, true);
    onProgress(metricSearchables.length / MAX_SIZE);
  }
  return metricSearchables;
}

function createMetricSearchable(post: Readonly<Post>, stringInterner: StringInterner): MetricSearchable {
  const metrics: Readonly<Record<Metric, number>> = {
    id: Number(post.id),
    score: post.score,
    width: post.width,
    height: post.height,
    duration: post.durationSeconds ?? 0,
    changedAt: post.changedAt
  };
  return {
    tags: new Set(post.tags.split(" ").filter(tag => tag !== "").map(tag => stringInterner.intern(tag))),
    getMetric: metric => metrics[metric]
  };
}

function yieldToBrowser(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve));
}

function formatTime(milliseconds: number): string {
  if (milliseconds < 1) {
    return `${Number((milliseconds * 1_000).toPrecision(3))} µs`;
  }
  return milliseconds < 1_000 ? `${Number(milliseconds.toPrecision(3))} ms` : `${Number((milliseconds / 1_000).toPrecision(3))} s`;
}

function formatRatio(ratio: number): string {
  return ratio >= 10 ? `${Math.round(ratio)}×` : `${ratio.toFixed(1)}×`;
}

function formatSize(size: number): string {
  return size >= 1_000_000 ? `${size / 1_000_000}M` : `${size / 1_000}k`;
}
