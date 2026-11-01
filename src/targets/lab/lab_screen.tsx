import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Stepper, StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { exportCorpus, importCorpus, pickCorpusFile, pullCorpus, requestReset, setFavoriteCount } from "@/targets/lab/databases";
import { exportRealDatabases, importRealDatabases, requestPurge } from "@/targets/lab/real_data";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/color_scheme";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { SettingRow } from "@/core/ui/components/setting_row/setting_row";
import { Switch } from "@/core/ui/components/switch/switch";
import { mountLabRoot } from "@/targets/lab/lab_root";

const LabScreenClass = {
  root: "fsg-LabScreen",
  nav: "fsg-LabScreen-nav",
  navLink: "fsg-LabScreen-navLink",
  main: "fsg-LabScreen-main",
  message: "fsg-LabScreen-message",
  section: "fsg-LabScreen-section",
  title: "fsg-LabScreen-title",
  row: "fsg-LabScreen-row",
  button: "fsg-LabScreen-button"
} as const;

type LabArea = "posts" | "favorites" | "benchmarks" | "storage" | "settings";

const AREAS: readonly { labArea: LabArea; title: string }[] = [
  { labArea: "posts", title: "Posts" },
  { labArea: "favorites", title: "Favorites" },
  { labArea: "benchmarks", title: "Benchmarks" },
  { labArea: "storage", title: "Storage" },
  { labArea: "settings", title: "Settings" }
];
const FAVORITE_COUNT_STEP = 10_000;
const IMPORT_WARNING = "Replace your real favorites databases with the ones in a backup file?";
const PURGE_WARNING = "Delete every IndexedDB database except the lab's (real favorites included) and all localStorage on this site?";
const RESET_WARNING = "Delete every lab post and favorite?";

export interface LabScreenConfiguration {
  readonly colorScheme: ColorScheme;
}

export interface LabScreenDependencies {
  stepperScheduler: StepperScheduler;
  postCount: Readable<number | null>;
  favoriteCount: Readable<number | null>;
  nativeHeaderVisible: StoredValue<boolean>;
  onStart: () => void;
}

function readArea(): LabArea {
  return AREAS.find(({ labArea }) => `#${labArea}` === location.hash)?.labArea ?? "posts";
}

export function mountLabScreen(container: HTMLElement, labScreenConfiguration: LabScreenConfiguration, labScreenDependencies: LabScreenDependencies): void {
  const { postCount, favoriteCount } = labScreenDependencies;
  const area = new Signal(readArea());
  const message = new Signal("Counting posts…");
  const isBusy = new Signal(false);
  const count = new Signal(0);
  const hasPosts = computed(() => (postCount.value ?? 0) > 0);
  const hasNoPosts = computed(() => postCount.value === 0);
  const run = (task: () => Promise<void>): void => {
    isBusy.value = true;
    task().catch((error: unknown) => {
      message.value = String(error);
      isBusy.value = false;
    });
  };
  const select = (nextLabArea: LabArea): void => {
    history.replaceState(null, "", `#${nextLabArea}`);
    area.value = nextLabArea;
  };
  const reportProgress = (verb: string) => (total: number): void => {
    message.value = `${verb} ${total.toLocaleString()} posts…`;
  };
  const importFromFile = async(): Promise<void> => {
    const file = await pickCorpusFile();

    if (file === null) {
      isBusy.value = false;
      return;
    }
    await importCorpus(file, reportProgress("Imported"));
    location.reload();
  };
  const pullFromFrozenCobalt = async(): Promise<void> => {
    await pullCorpus(reportProgress("Pulled"));
    location.reload();
  };
  const exportToFile = async(): Promise<void> => {
    message.value = `Exported ${(await exportCorpus()).toLocaleString()} posts.`;
    isBusy.value = false;
  };
  const start = async(): Promise<void> => {
    await setFavoriteCount(count.peek());
    labScreenDependencies.onStart();
  };
  const runOnRealData = (task: () => Promise<string>, warning?: string): void => {
    if (warning !== undefined && !confirm(warning)) {
      return;
    }
    run(async() => {
      message.value = await task();
      isBusy.value = false;
    });
  };
  const confirmThen = (warning: string, action: () => void) => (): void => {
    if (confirm(warning)) {
      action();
    }
  };
  const button = (label: string, onClick: () => void): HTMLElement => (
    <button className={LabScreenClass.button} type="button" disabled={isBusy} onClick={onClick}>{label}</button>
  );
  const section = (labArea: LabArea, ...children: HTMLElement[]): HTMLElement => (
    <section className={LabScreenClass.section} hidden={computed(() => area.value !== labArea)}>
      <h2 className={LabScreenClass.title}>{AREAS.find(entry => entry.labArea === labArea)?.title}</h2>
      {children}
    </section>
  );

  mountLabRoot(container, labScreenConfiguration.colorScheme).append(render(document, () => {
    effect(() => {
      const posts = postCount.value;

      if (posts !== null) {
        message.value = posts === 0 ? "No posts yet." : `${posts.toLocaleString()} posts.`;
      }
    });
    effect(() => {
      count.value = favoriteCount.value ?? 0;
    });
    return (
      <div className={LabScreenClass.root}>
        <nav className={LabScreenClass.nav} aria-label="Lab">
          {AREAS.map(({ labArea, title }) => (
            <button className={LabScreenClass.navLink} type="button"
              aria-current={computed(() => (area.value === labArea ? "page" : null))} onClick={() => select(labArea)}>
              {title}
            </button>
          ))}
        </nav>
        <main className={LabScreenClass.main}>
          <p className={LabScreenClass.message}>{message}</p>
          {section(
            "posts",
            <div className={LabScreenClass.row} hidden={computed(() => !hasNoPosts.value)}>
              {button("Pull from local Frozen Cobalt", () => run(pullFromFrozenCobalt))}
              {button("Import file", () => run(importFromFile))}
            </div>,
            <div className={LabScreenClass.row} hidden={computed(() => !hasPosts.value)}>
              {button("Export file", () => run(exportToFile))}
              {button("Reset", confirmThen(RESET_WARNING, requestReset))}
            </div>
          )}
          {section(
            "favorites",
            <p hidden={computed(() => !hasNoPosts.value)}>Add posts first.</p>,
            <div className={LabScreenClass.row} hidden={computed(() => !hasPosts.value)}>
              <Stepper
                label="Favorites"
                min={0}
                max={computed(() => postCount.value ?? 0)}
                step={FAVORITE_COUNT_STEP}
                scheduler={labScreenDependencies.stepperScheduler}
                value={count}
                disabled={isBusy}
                onValueChange={next => {
                  count.value = next;
                }}
              />
              {button("Start", () => run(start))}
            </div>
          )}
          {section("benchmarks", <p>Not built yet.</p>)}
          {section(
            "storage",
            <div className={LabScreenClass.row}>
              {button("Export file", () => runOnRealData(exportRealDatabases))}
              {button("Import file", () => runOnRealData(importRealDatabases, IMPORT_WARNING))}
              {button("Reset", confirmThen(PURGE_WARNING, requestPurge))}
            </div>
          )}
          {section(
            "settings",
            <SettingRow
              label="Native header"
              control={<Switch value={labScreenDependencies.nativeHeaderVisible} onValueChange={next => labScreenDependencies.nativeHeaderVisible.set(next)} />}
            />
          )}
        </main>
      </div>
    );
  }).result);
}
