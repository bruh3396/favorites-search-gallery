import { Readable, Signal } from "@/core/utils/reactive/signal";
import { onCleanup } from "@/core/utils/reactive/scope";

const TEXTAREA_EVENT_TYPES = ["input", "focus", "blur", "selectionchange"] as const;

export function trackCaret(textarea: HTMLTextAreaElement): Readable<number | null> {
  const caretIndex = new Signal<number | null>(null);
  const { ownerDocument } = textarea;
  const readCaret = (): void => {
    const { activeElement } = textarea.getRootNode() as Document | ShadowRoot;

    caretIndex.value = activeElement === textarea && textarea.selectionStart === textarea.selectionEnd ? textarea.selectionStart : null;
  };

  for (const type of TEXTAREA_EVENT_TYPES) {
    textarea.addEventListener(type, readCaret);
  }
  ownerDocument.addEventListener("selectionchange", readCaret);
  onCleanup(() => ownerDocument.removeEventListener("selectionchange", readCaret));
  return caretIndex;
}
