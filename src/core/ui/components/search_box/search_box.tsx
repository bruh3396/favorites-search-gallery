import { Child, h } from "@/core/ui/h/h";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { HistoryNavigator } from "@/core/ui/components/search_box/history_navigator";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { SearchBoxAssist } from "@/core/ui/components/search_box/search_box_assist";
import { SearchBoxTextSpan } from "@/core/ui/components/search_box/search_box_text_span";
import { TextEdit } from "@/core/ui/components/search_box/text_edit";
import { createSearchBoxInput } from "@/core/ui/components/search_box/search_box_input";
import { onCleanup } from "@/core/utils/reactive/scope";

export const SearchBoxClass = {
  root: "fsg-SearchBox",
  field: "fsg-SearchBox-field",
  submit: "fsg-SearchBox-submit",
  clear: "fsg-SearchBox-clear",
  popup: "fsg-SearchBox-popup"
} as const;

const MAX_LINE_COUNT = 8;
const LINE_COUNT_PROPERTY = "--fsg-SearchBox-line-count";

export interface SearchBoxProps {
  label: string;
  query: Readable<string>;
  submittedQueries?: Readable<readonly string[]>;
  trailingChild?: Child;
  fieldPopupChild?: Child;
  focusRequests?: Occurrence<void>;
  assist?: SearchBoxAssist;
  activeDescendantElement?: Readable<HTMLElement | null>;
  getTextSpans?: (text: string) => readonly SearchBoxTextSpan[];
  onSearch: (query: string) => void;
  searchElsewhere?: (query: string) => void;
}

export function SearchBox({
  label, query, submittedQueries, trailingChild, fieldPopupChild, focusRequests, assist: searchBoxAssist, activeDescendantElement,
  getTextSpans, onSearch, searchElsewhere
}: SearchBoxProps): HTMLElement {
  const root = <search className={SearchBoxClass.root} />;
  const text = new Signal("");
  const searchBoxInput = createSearchBoxInput({ label, text, getTextSpans });
  const { textarea } = searchBoxInput;
  const submitButton = <IconButton className={SearchBoxClass.submit} icon="search" label="Search" type="submit" />;
  const historyNavigator = submittedQueries === undefined ? undefined : new HistoryNavigator({ submittedQueries });
  const field = (
    <form
      className={SearchBoxClass.field}
      onSubmit={event => {
        event.preventDefault();
        historyNavigator?.stopRecalling();
        onSearch(textarea.value);
      }}
    >
      {submitButton}
      {searchBoxInput.root}
      <IconButton
        className={SearchBoxClass.clear}
        icon="close"
        label="Clear Search"
        onClick={() => {
          text.value = "";
          historyNavigator?.stopRecalling();
          fitToText(textarea, root);
          textarea.focus();
        }}
      />
      {trailingChild}
    </form>
  ) as HTMLFormElement;

  textarea.addEventListener("keydown", event => {
    if (searchBoxAssist?.handleKey(event)) {
      event.preventDefault();
      return;
    }

    if (event.key === "Escape" && !event.isComposing) {
      event.preventDefault();
      textarea.blur();
      return;
    }

    if (event.key !== "Enter" || event.isComposing) {
      return;
    }
    event.preventDefault();

    if (!event.shiftKey) {
      field.requestSubmit();
    }
  });
  effect(() => {
    text.value = query.value;
  });
  textarea.addEventListener("input", () => fitToText(textarea, root));
  textarea.addEventListener("focus", () => fitToText(textarea, root));

  if (historyNavigator !== undefined) {
    textarea.addEventListener("keydown", event => {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      const recalledText = recall(historyNavigator, event.key, textarea);

      if (recalledText !== undefined) {
        event.preventDefault();
        const caret = event.key === "ArrowUp" ? 0 : recalledText.length;

        text.value = recalledText;
        textarea.setSelectionRange(caret, caret);
        fitToText(textarea, root);
      }
    });
    textarea.addEventListener("input", () => historyNavigator.stopRecalling());
  }

  if (searchBoxAssist !== undefined) {
    textarea.setAttribute("aria-autocomplete", "list");
    textarea.addEventListener("input", () => searchBoxAssist.update(textarea.value, textarea.selectionStart));
    textarea.addEventListener("blur", () => searchBoxAssist.close());
    textarea.addEventListener("click", () => searchBoxAssist.close());
    onCleanup(searchBoxAssist.textEdits.on(textEdit => applyTextEdit(textarea, textEdit)));
  }

  if (activeDescendantElement !== undefined) {
    effect(() => {
      textarea.ariaActiveDescendantElement = activeDescendantElement.value;
    });
  }

  if (focusRequests !== undefined) {
    onCleanup(focusRequests.on(() => textarea.focus()));
  }

  if (searchElsewhere !== undefined) {
    submitButton.addEventListener("contextmenu", event => {
      event.preventDefault();
      searchElsewhere(textarea.value);
    });
    submitButton.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        searchElsewhere(textarea.value);
      }
    });
  }
  root.append(field, <div className={SearchBoxClass.popup}>{fieldPopupChild}</div>);
  return root;
}

function applyTextEdit(textarea: HTMLTextAreaElement, { start, end, text }: TextEdit): void {
  textarea.setSelectionRange(start, end);
  textarea.ownerDocument.execCommand("insertText", false, text);
}

function recall(historyNavigator: HistoryNavigator, key: string, textarea: HTMLTextAreaElement): string | undefined {
  switch (key) {
    case "ArrowUp":
      return isWrapped(textarea) && !isCaretAt(textarea, 0) ? undefined : historyNavigator.recallOlder(textarea.value);
    case "ArrowDown":
      return isWrapped(textarea) && !isCaretAt(textarea, textarea.value.length) ? undefined : historyNavigator.recallNewer();
    default:
      return undefined;
  }
}

function fitToText(textarea: HTMLTextAreaElement, root: HTMLElement): void {
  root.style.setProperty(LINE_COUNT_PROPERTY, "1");
  const lineCount = countLines(textarea);

  root.style.setProperty(LINE_COUNT_PROPERTY, String(lineCount > 1 ? Math.min(lineCount, MAX_LINE_COUNT) : 1));
}

function isWrapped(textarea: HTMLTextAreaElement): boolean {
  return countLines(textarea) > 1;
}

function countLines(textarea: HTMLTextAreaElement): number {
  return Math.round(textarea.scrollHeight / parseFloat(textarea.ownerDocument.defaultView!.getComputedStyle(textarea).lineHeight));
}

function isCaretAt(textarea: HTMLTextAreaElement, index: number): boolean {
  return textarea.selectionStart === index && textarea.selectionEnd === index;
}
