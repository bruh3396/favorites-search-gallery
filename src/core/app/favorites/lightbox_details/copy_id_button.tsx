import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const CopyIdButtonClass = {
  root: "fsg-CopyIdButton",
  copied: "fsg-CopyIdButton-copied"
} as const;

const COPIED_DURATION = 1_500;

export interface CopyIdButtonProps {
  id: Readable<string | undefined>;
  clipboard: Pick<Clipboard, "write">;
  scheduler: Pick<Scheduler, "schedule">;
}

export function CopyIdButton({ id, clipboard, scheduler }: CopyIdButtonProps): HTMLElement {
  const copied = new Signal(false);
  let cancelCopied = (): void => undefined;

  function copyId(): void {
    const shownId = id.peek();

    if (shownId === undefined) {
      return;
    }
    clipboard.write(shownId).then(() => {
      cancelCopied();
      copied.value = true;
      cancelCopied = scheduler.schedule(() => {
        copied.value = false;
      }, COPIED_DURATION);
    }, console.error);
  }

  effect(() => {
    void id.value;
    cancelCopied();
    copied.value = false;
  });
  onCleanup(() => cancelCopied());
  return (
    <button type="button" className={CopyIdButtonClass.root} title="Copy id" onClick={copyId}>
      {computed(() => (id.value === undefined ? "" : `#${id.value}`))}
      <span className={CopyIdButtonClass.copied} hidden={computed(() => !copied.value)}>Copied</span>
    </button>
  ) as HTMLElement;
}
