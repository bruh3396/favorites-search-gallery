import { Readable, effect } from "@/core/utils/reactive/signal";

export const StatusTextClass = {
  root: "fsg-StatusText"
} as const;

export interface StatusTextOptions {
  text: Readable<string>;
}

export interface StatusText {
  readonly element: HTMLElement;
  dispose: () => void;
}

export function createStatusText(ownerDocument: Document, { text }: StatusTextOptions): StatusText {
  const element = ownerDocument.createElement("div");
  const dispose = effect(() => {
    element.textContent = text.value;
  });

  element.className = StatusTextClass.root;
  element.setAttribute("role", "status");
  return { element, dispose };
}
