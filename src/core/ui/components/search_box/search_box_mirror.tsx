import { Readable, effect } from "@/core/utils/reactive/signal";
import { SearchBoxTextSpan } from "@/core/ui/components/search_box/search_box_text_span";
import { h } from "@/core/ui/h/h";

export const SearchBoxMirrorClass = {
  root: "fsg-SearchBoxMirror",
  span: "fsg-SearchBoxMirror-span"
} as const;

const TONE_COUNT = 3;

export interface SearchBoxMirrorProps {
  text: Readable<string>;
  textSpans: Readable<readonly SearchBoxTextSpan[]>;
  caretIndex: Readable<number | null>;
  className?: string;
}

export function SearchBoxMirror({ text, textSpans, caretIndex, className }: SearchBoxMirrorProps): HTMLElement {
  const root = <div className={className === undefined ? SearchBoxMirrorClass.root : `${SearchBoxMirrorClass.root} ${className}`} aria-hidden="true" />;

  effect(() => {
    const searchBoxTextSpans = textSpans.value;

    showText(root, text.value, searchBoxTextSpans);

    for (const index of findPairedIndexes(searchBoxTextSpans, caretIndex.value)) {
      root.children[index].setAttribute("data-paired", "");
    }
  });
  return root;
}

function showText(root: HTMLElement, text: string, searchBoxTextSpans: readonly SearchBoxTextSpan[]): void {
  root.replaceChildren(...searchBoxTextSpans.flatMap((searchBoxTextSpan, index) => [
    text.slice(searchBoxTextSpans[index - 1]?.end ?? 0, searchBoxTextSpan.start),
    createSpan(root.ownerDocument, text, searchBoxTextSpan)
  ]), text.slice(searchBoxTextSpans.at(-1)?.end ?? 0));
}

function createSpan(ownerDocument: Document, text: string, { start, end, tone }: SearchBoxTextSpan): HTMLElement {
  const span = ownerDocument.createElement("span");

  span.className = SearchBoxMirrorClass.span;
  span.dataset.tone = String(tone % TONE_COUNT);
  span.textContent = text.slice(start, end);
  return span;
}

function findPairedIndexes(searchBoxTextSpans: readonly SearchBoxTextSpan[], caretIndex: number | null): number[] {
  if (caretIndex === null) {
    return [];
  }
  const index = searchBoxTextSpans.findIndex(({ start, end, matchedStart }) => matchedStart !== undefined && (start === caretIndex || end === caretIndex));
  const matchedIndex = index === -1 ? -1 : searchBoxTextSpans.findIndex(({ start }) => start === searchBoxTextSpans[index].matchedStart);
  return matchedIndex === -1 ? [] : [index, matchedIndex];
}
