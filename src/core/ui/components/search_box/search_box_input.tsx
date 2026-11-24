import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { SearchBoxMirror } from "@/core/ui/components/search_box/search_box_mirror";
import { SearchBoxTextSpan } from "@/core/ui/components/search_box/search_box_text_span";
import { h } from "@/core/ui/h/h";
import { trackCaret } from "@/core/ui/components/search_box/caret_tracker";

export const SearchBoxInputClass = {
  root: "fsg-SearchBoxInput",
  textarea: "fsg-SearchBoxInput-textarea",
  mirror: "fsg-SearchBoxInput-mirror"
} as const;

const LINE_BREAK = /[\r\n]/;
const LINE_BREAKS = /\r\n?|\n/g;

export interface SearchBoxInput {
  readonly root: HTMLElement;
  readonly textarea: HTMLTextAreaElement;
}

export interface SearchBoxInputProps {
  label: string;
  text: Signal<string>;
  getTextSpans?: (text: string) => readonly SearchBoxTextSpan[];
}

export function createSearchBoxInput({ label, text, getTextSpans }: SearchBoxInputProps): SearchBoxInput {
  const textarea = <textarea className={SearchBoxInputClass.textarea} rows={1} spellcheck={false}
    placeholder={label} aria-label={label} /> as HTMLTextAreaElement;
  const root = <div className={SearchBoxInputClass.root}>{textarea}</div>;

  effect(() => {
    textarea.value = text.value;
  });
  textarea.addEventListener("input", () => {
    flattenLineBreaks(textarea);
    text.value = textarea.value;
  });
  textarea.addEventListener("blur", () => {
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
  });

  if (getTextSpans !== undefined) {
    const mirror = (
      <SearchBoxMirror className={SearchBoxInputClass.mirror} text={text}
        textSpans={computed(() => getTextSpans(text.value))} caretIndex={trackCaret(textarea)} />
    );

    textarea.addEventListener("scroll", () => {
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
    });
    root.append(mirror);
  }
  return { root, textarea };
}

function flattenLineBreaks(textarea: HTMLTextAreaElement): void {
  if (!LINE_BREAK.test(textarea.value)) {
    return;
  }
  const textBeforeCaret = textarea.value.slice(0, textarea.selectionStart).replace(LINE_BREAKS, " ");

  textarea.value = textBeforeCaret + textarea.value.slice(textarea.selectionStart).replace(LINE_BREAKS, " ");
  textarea.setSelectionRange(textBeforeCaret.length, textBeforeCaret.length);
}
