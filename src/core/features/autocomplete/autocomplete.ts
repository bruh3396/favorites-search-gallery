import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { FoundSearchTerm } from "@/core/domain/search/parsers/found_search_term";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { SearchBoxAssist } from "@/core/ui/components/search_box/search_box_assist";
import { Suggester } from "@/core/features/autocomplete/suggester";
import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";
import { TextEdit } from "@/core/ui/components/search_box/text_edit";
import { findSearchTerm } from "@/core/domain/search/parsers/search_term_finder";
import { isSearchExpressionOperator } from "@/core/domain/search/parsers/search_expression_operator";

export interface AutocompleteDependencies {
  suggesters: readonly Suggester[];
}

export class Autocomplete implements SearchBoxAssist {
  private foundSearchTerm: FoundSearchTerm | undefined;
  readonly #suggestions = new Signal<readonly Suggestion[]>([]);
  readonly #highlightedIndex = new Signal<number | null>(null);
  readonly #textEdits = new Emitter<TextEdit>();

  constructor(private readonly dependencies: AutocompleteDependencies) { }

  public get suggestions(): Readable<readonly Suggestion[]> {
    return this.#suggestions;
  }

  public get highlightedIndex(): Readable<number | null> {
    return this.#highlightedIndex;
  }

  public get textEdits(): Occurrence<TextEdit> {
    return this.#textEdits;
  }

  public readonly accept = (suggestion: Suggestion): void => {
    if (this.foundSearchTerm !== undefined) {
      const { start, end } = this.foundSearchTerm;

      this.#textEdits.emit({ start, end, text: suggestion.acceptedText ?? suggestion.text });
    }
  };

  public update(query: string, caret: number): void {
    this.foundSearchTerm = findSearchTerm(query, caret);
    this.#highlightedIndex.value = null;
    this.#suggestions.value = this.listSuggestions(query);
  }

  public close(): void {
    this.foundSearchTerm = undefined;
    this.#suggestions.value = [];
    this.#highlightedIndex.value = null;
  }

  public handleKey(event: KeyboardEvent): boolean {
    const currentSuggestions = this.#suggestions.peek();

    if (currentSuggestions.length === 0 || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return false;
    }
    const currentHighlightedIndex = this.#highlightedIndex.peek();

    switch (event.key) {
      case "ArrowDown":
        this.#highlightedIndex.value = ((currentHighlightedIndex ?? -1) + 1) % currentSuggestions.length;
        return true;
      case "ArrowUp":
        this.#highlightedIndex.value = ((currentHighlightedIndex ?? 0) + currentSuggestions.length - 1) % currentSuggestions.length;
        return true;
      case "Tab":
        this.accept(currentSuggestions[currentHighlightedIndex ?? 0]);
        return true;
      case "Enter":
        if (currentHighlightedIndex === null) {
          return false;
        }
        this.accept(currentSuggestions[currentHighlightedIndex]);
        return true;
      case "Escape":
        this.close();
        return true;
      case "ArrowLeft":
      case "ArrowRight":
      case "Home":
      case "End":
        this.close();
        return false;
      default:
        return false;
    }
  }

  private listSuggestions(query: string): readonly Suggestion[] {
    const { foundSearchTerm } = this;

    if (foundSearchTerm === undefined || isUnsuggestable(query, foundSearchTerm)) {
      return [];
    }
    const prefix = foundSearchTerm.prefix.toLowerCase();
    return this.dependencies.suggesters
      .flatMap(suggester => suggester.suggest(prefix))
      .map(suggestion => ({ ...suggestion, matchedLength: prefix.length }));
  }
}

function isUnsuggestable(query: string, { start, end, prefix }: FoundSearchTerm): boolean {
  return query.slice(start, end).includes("*") || isSearchExpressionOperator(prefix) || prefix === "-";
}
