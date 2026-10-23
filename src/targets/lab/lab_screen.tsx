import { Stepper, StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { h, render } from "@/core/ui/h/h";
import { pickCorpus, requestReset, setFavoriteCount, writeCorpus } from "@/targets/lab/lab_databases";
import { ColorScheme } from "@/core/boundary/environment";
import { Signal } from "@/core/utils/reactive/signal";
import { mountLabRoot } from "@/targets/lab/lab_root";

const LabScreenClass = {
  root: "fsg-LabScreen",
  message: "fsg-LabScreen-message",
  row: "fsg-LabScreen-row",
  label: "fsg-LabScreen-label",
  button: "fsg-LabScreen-button"
} as const;

const FAVORITE_COUNT_STEP = 10_000;

export interface LabScreenConfiguration {
  readonly colorScheme: ColorScheme;
  readonly corpusSize: number;
  readonly favoriteCount: number;
}

export interface LabScreenDependencies {
  scheduler: StepperScheduler;
  onStart: () => void;
}

export function mountLabScreen(container: HTMLElement, configuration: LabScreenConfiguration, dependencies: LabScreenDependencies): void {
  const { colorScheme, corpusSize, favoriteCount } = configuration;
  const message = new Signal(corpusSize === 0 ? "No corpus yet. Import a corpus file to start." : `${corpusSize.toLocaleString()} posts in the corpus.`);
  const isBusy = new Signal(false);
  const count = new Signal(favoriteCount);
  const run = (task: () => Promise<void>): void => {
    isBusy.value = true;
    task().catch((error: unknown) => {
      message.value = String(error);
      isBusy.value = false;
    });
  };
  const importCorpus = async(): Promise<void> => {
    const corpus = await pickCorpus();

    if (corpus === null) {
      isBusy.value = false;
      return;
    }
    message.value = `Writing ${corpus.posts.length.toLocaleString()} posts…`;
    await writeCorpus(corpus);
    location.reload();
  };
  const start = async(): Promise<void> => {
    await setFavoriteCount(count.peek());
    dependencies.onStart();
  };

  mountLabRoot(container, colorScheme).append(render(document, () => (
    <div className={LabScreenClass.root}>
      <p className={LabScreenClass.message}>{message}</p>
      {corpusSize === 0 && (
        <button className={LabScreenClass.button} type="button" disabled={isBusy} onClick={() => run(importCorpus)}>Import corpus</button>
      )}
      {corpusSize > 0 && [
          <div className={LabScreenClass.row}>
            <span className={LabScreenClass.label}>Favorites</span>
            <Stepper
              label="Favorites"
              min={0}
              max={corpusSize}
              step={FAVORITE_COUNT_STEP}
              scheduler={dependencies.scheduler}
              value={count}
              disabled={isBusy}
              onValueChange={next => {
                count.value = next;
              }}
            />
          </div>,
          <div className={LabScreenClass.row}>
            <button className={LabScreenClass.button} type="button" dataset={{ variant: "primary" }} disabled={isBusy} onClick={() => run(start)}>
              Start
            </button>
            <button className={LabScreenClass.button} type="button" disabled={isBusy} onClick={requestReset}>Reset</button>
          </div>
      ]}
    </div>
  )).result);
}
