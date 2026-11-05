import { Suggester } from "@/core/features/autocomplete/suggester";
import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";

export interface TagSuggesterConfiguration {
  readonly maxSuggestionCount: number;
}

export const DEFAULT_TAG_SUGGESTER_CONFIGURATION: TagSuggesterConfiguration = {
  maxSuggestionCount: 10
};

export interface TagSuggesterDependencies {
  getTagsStartingWith: (prefix: string) => readonly string[];
  countFavoritesWithTag: (tag: string) => number;
}

export class TagSuggester implements Suggester {
  constructor(
    private readonly configuration: TagSuggesterConfiguration,
    private readonly dependencies: TagSuggesterDependencies
  ) { }

  public suggest(prefix: string): readonly Suggestion[] {
    const { getTagsStartingWith, countFavoritesWithTag } = this.dependencies;
    return getTagsStartingWith(prefix)
      .map(tag => ({ tag, count: countFavoritesWithTag(tag) }))
      .toSorted((a, b) => b.count - a.count)
      .slice(0, this.configuration.maxSuggestionCount)
      .map(({ tag, count }) => ({ text: tag, acceptedText: `${tag} `, icon: "tag", detail: String(count) }));
  }
}
