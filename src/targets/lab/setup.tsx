import { EmptyState, EmptyStateAction } from "@/core/ui/components/empty_state/empty_state";
import { h, render } from "@/core/ui/h/h";
import { pickJsonFile, writeLegacySnapshot } from "@/targets/lab/lab_databases";
import { ColorScheme } from "@/core/boundary/environment";
import { Signal } from "@/core/utils/reactive/signal";
import { mountLabRoot } from "@/targets/lab/lab_root";

const SETUP_MESSAGE = "No lab data yet. Load a legacy snapshot and the real migration moves it into the lab.";

export function mountSetup(container: HTMLElement, colorScheme: ColorScheme): void {
  const root = mountLabRoot(container, colorScheme);
  const message = new Signal(SETUP_MESSAGE);
  const action = new Signal<EmptyStateAction | null>(null);
  const load = { label: "Load legacy snapshot", onClick: (): void => {
    loadLegacySnapshot(message, action).catch((error: unknown) => {
      message.value = `Couldn't load the snapshot: ${String(error)}`;
      action.value = load;
    });
  } };

  action.value = load;
  root.append(render(document, () => <EmptyState isShown={new Signal(true)} message={message} action={action} />).result);
}

async function loadLegacySnapshot(message: Signal<string>, action: Signal<EmptyStateAction | null>): Promise<void> {
  const snapshot = await pickJsonFile();

  if (snapshot === null) {
    return;
  }
  message.value = "Writing the snapshot…";
  action.value = null;
  await writeLegacySnapshot(snapshot);
  location.reload();
}
