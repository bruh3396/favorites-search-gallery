import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { KeyedList } from "@/core/ui/h/keyed_list";
import { ListboxClass } from "@/core/ui/components/listbox/listbox";
import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export const SuggestionListClass = {
  root: "fsg-SuggestionList",
  row: "fsg-SuggestionList-row",
  icon: "fsg-SuggestionList-icon",
  text: "fsg-SuggestionList-text",
  match: "fsg-SuggestionList-match",
  detail: "fsg-SuggestionList-detail"
} as const;

export interface SuggestionListProps {
  suggestions: Readable<readonly Suggestion[]>;
  highlightedIndex: Readable<number | null>;
  onAccept: (suggestion: Suggestion) => void;
  onActiveDescendantChange?: (activeDescendantElement: HTMLElement | null) => void;
}

export function SuggestionList({ suggestions, highlightedIndex, onAccept, onActiveDescendantChange }: SuggestionListProps): HTMLElement {
  const renderedSuggestions = new KeyedList<Suggestion>({
    getKey: (suggestion): string => JSON.stringify(suggestion),
    create: (suggestion): HTMLElement => <Row suggestion={suggestion} onAccept={onAccept} />
  });
  const rowElements = computed(() => renderedSuggestions.reconcile(suggestions.value));
  const list = <ul className={`${ListboxClass.root} ${SuggestionListClass.root}`} role="listbox" onMousedown={event => event.preventDefault()} />;

  effect(() => list.replaceChildren(...rowElements.value));
  effect(() => {
    const currentHighlightedIndex = highlightedIndex.value;

    rowElements.value.forEach((rowElement, index) => rowElement.setAttribute("aria-selected", String(index === currentHighlightedIndex)));

    const activeDescendantElement = currentHighlightedIndex === null ? null : rowElements.value[currentHighlightedIndex] ?? null;

    activeDescendantElement?.scrollIntoView?.({ block: "nearest" });
    onActiveDescendantChange?.(activeDescendantElement);
  });
  return list;
}

function Row({ suggestion, onAccept }: Pick<SuggestionListProps, "onAccept"> & { suggestion: Suggestion }): HTMLElement {
  const { text, matchedLength = 0, icon, detail } = suggestion;
  return (
    <li className={`${ListboxClass.option} ${SuggestionListClass.row}`} role="option" onClick={() => onAccept(suggestion)}>
      {icon !== undefined && createIcon(icon, SuggestionListClass.icon)}
      <span className={SuggestionListClass.text}>
        <b className={SuggestionListClass.match}>{text.slice(0, matchedLength)}</b>
        {text.slice(matchedLength)}
      </span>
      {detail !== undefined && <span className={SuggestionListClass.detail}>{detail}</span>}
    </li>
  );
}
