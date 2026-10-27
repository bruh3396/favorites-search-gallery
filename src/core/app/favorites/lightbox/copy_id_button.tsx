import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const CopyIdButtonClass = {
  root: "fsg-CopyIdButton",
  copied: "fsg-CopyIdButton-copied"
} as const;

export interface CopyIdButtonProps {
  postId: Readable<string | undefined>;
  clipboard: Pick<Clipboard, "write">;
  scheduler: Pick<Scheduler, "schedule">;
  copiedDuration: number;
}

export function CopyIdButton({ postId, clipboard, scheduler, copiedDuration }: CopyIdButtonProps): HTMLElement {
  const copied = new Signal(false);
  let cancelCopied = (): void => undefined;

  function copyPostId(): void {
    const shownPostId = postId.peek();

    if (shownPostId === undefined) {
      return;
    }
    clipboard.write(shownPostId).then(() => {
      cancelCopied();
      copied.value = true;
      cancelCopied = scheduler.schedule(() => {
        copied.value = false;
      }, copiedDuration);
    }, console.error);
  }

  effect(() => {
    void postId.value;
    cancelCopied();
    copied.value = false;
  });
  onCleanup(() => cancelCopied());
  return (
    <button type="button" className={CopyIdButtonClass.root} title="Copy id" onClick={copyPostId}>
      {computed(() => postId.value ?? "")}
      <span className={CopyIdButtonClass.copied} hidden={computed(() => !copied.value)}>Copied</span>
    </button>
  ) as HTMLElement;
}
