import { Readable, effect } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";
import { h } from "@/core/ui/h/h";

export const LightboxScreenClass = {
  root: "fsg-LightboxScreen"
} as const;

export interface LightboxScreenProps {
  current: Readable<MediaItem | undefined>;
  onClose: () => void;
}

export function LightboxScreen({ current, onClose }: LightboxScreenProps): HTMLElement {
  const dialog = (
    <dialog className={LightboxScreenClass.root} aria-label="Gallery" autofocus onClose={event => reportDismissal(event.currentTarget, current, onClose)} />
  ) as HTMLDialogElement;

  effect(() => showPost(dialog, current.value));
  return dialog;
}

function showPost(dialog: HTMLDialogElement, post: MediaItem | undefined): void {
  if (post === undefined) {
    dialog.close();
    return;
  }

  if (!dialog.open) {
    dialog.showModal();
  }
}

function reportDismissal(dialog: HTMLDialogElement, current: Readable<MediaItem | undefined>, onClose: () => void): void {
  if (!dialog.open && current.peek() !== undefined) {
    onClose();
  }
}
