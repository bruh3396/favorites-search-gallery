import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Stepper, StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { exportCorpus, importCorpus, pickCorpusFile, pullCorpus, requestReset, setFavoriteCount } from "@/targets/lab/databases";
import { exportRealDatabases, importRealDatabases, requestPurge } from "@/targets/lab/real_data";
import { h, render } from "@/core/ui/h/h";
import { ColorScheme } from "@/core/boundary/environment";
import { Preference } from "@/core/utils/preference/preference";
import { SettingRow } from "@/core/ui/components/setting_row/setting_row";
import { Switch } from "@/core/ui/components/switch/switch";
import { mountLabRoot } from "@/targets/lab/root";

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

const AREAS: readonly { id: LabArea; title: string }[] = [
  { id: "posts", title: "Posts" },
  { id: "favorites", title: "Favorites" },
  { id: "benchmarks", title: "Benchmarks" },
  { id: "storage", title: "Storage" },
  { id: "settings", title: "Settings" }
];
const FAVORITE_COUNT_STEP = 10_000;
const IMPORT_WARNING = "Replace your real favorites databases with the ones in a backup file?";
const PURGE_WARNING = "Delete every IndexedDB database except the lab's (real favorites included) and all localStorage on this site?";
const RESET_WARNING = "Delete every lab post and favorite?";

export interface LabScreenConfiguration {
  readonly colorScheme: ColorScheme;
}

export interface LabScreenDependencies {
  scheduler: StepperScheduler;
  postCount: Readable<number | null>;
  favoriteCount: Readable<number | null>;
  nativeHeaderVisible: Preference<boolean>;
  onStart: () => void;
}

function readArea(): LabArea {
  return AREAS.find(({ id }) => `#${id}` === location.hash)?.id ?? "posts";
}

export function mountLabScreen(container: HTMLElement, configuration: LabScreenConfiguration, dependencies: LabScreenDependencies): void {
  const { postCount, favoriteCount } = dependencies;
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
  const select = (next: LabArea): void => {
    history.replaceState(null, "", `#${next}`);
    area.value = next;
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
    dependencies.onStart();
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
  const section = (id: LabArea, ...children: HTMLElement[]): HTMLElement => (
    <section className={LabScreenClass.section} hidden={computed(() => area.value !== id)}>
      <h2 className={LabScreenClass.title}>{AREAS.find(entry => entry.id === id)?.title}</h2>
      {children}
    </section>
  );

  mountLabRoot(container, configuration.colorScheme).append(render(document, () => {
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
          {AREAS.map(({ id, title }) => (
            <button className={LabScreenClass.navLink} type="button"
              aria-current={computed(() => (area.value === id ? "page" : null))} onClick={() => select(id)}>
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
                scheduler={dependencies.scheduler}
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
              control={<Switch value={dependencies.nativeHeaderVisible} onValueChange={next => dependencies.nativeHeaderVisible.set(next)} />}
            />
          )}
        </main>
      </div>
    );
  }).result);
}
