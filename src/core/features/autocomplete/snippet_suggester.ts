import { Snippet } from "@/core/domain/snippet/snippet";
import { SnippetLibrary } from "@/core/features/snippets/snippet_library";
import { Suggester } from "@/core/features/autocomplete/suggester";
import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";

export interface SnippetSuggesterConfiguration {
  readonly maxSuggestionCount: number;
  readonly minPrefixLength: number;
}

export const DEFAULT_SNIPPET_SUGGESTER_CONFIGURATION: SnippetSuggesterConfiguration = {
  maxSuggestionCount: 3,
  minPrefixLength: 2
};

export interface SnippetSuggesterDependencies {
  snippetLibrary: Pick<SnippetLibrary, "snippets" | "recordUse">;
}

export class SnippetSuggester implements Suggester {
  constructor(
    private readonly configuration: SnippetSuggesterConfiguration,
    private readonly dependencies: SnippetSuggesterDependencies
  ) { }

  public suggest(prefix: string): readonly Suggestion[] {
    const { maxSuggestionCount, minPrefixLength } = this.configuration;

    if (prefix.length < minPrefixLength || prefix.includes(":")) {
      return [];
    }
    return this.dependencies.snippetLibrary.snippets.value
      .filter(snippet => snippet.name.toLowerCase().startsWith(prefix))
      .toSorted((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, maxSuggestionCount)
      .map(snippet => this.describeSnippet(snippet));
  }

  private describeSnippet(snippet: Snippet): Suggestion {
    return {
      text: snippet.name,
      acceptedText: `${snippet.query} `,
      icon: "bookmark",
      detail: snippet.query,
      onAccept: (): void => {
        this.dependencies.snippetLibrary.recordUse(snippet.name).catch(console.error);
      }
    };
  }
}
