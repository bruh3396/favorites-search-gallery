import { Suggester } from "@/core/features/autocomplete/suggester";
import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { TagCategoryResolver } from "@/core/features/tag_categories/tag_category_resolver";

export const TagSuggesterClass = {
  artist: "fsg-TagSuggester-artist",
  character: "fsg-TagSuggester-character",
  copyright: "fsg-TagSuggester-copyright",
  metadata: "fsg-TagSuggester-metadata"
} as const;

export interface TagSuggesterConfiguration {
  readonly maxSuggestionCount: number;
}

export const DEFAULT_TAG_SUGGESTER_CONFIGURATION: TagSuggesterConfiguration = {
  maxSuggestionCount: 10
};

export interface TagSuggesterDependencies {
  getTagsStartingWith: (prefix: string) => readonly string[];
  countFavoritesWithTag: (tag: string) => number;
  tagCategoryResolver: Pick<TagCategoryResolver, "resolveCommon">;
}

export class TagSuggester implements Suggester {
  constructor(
    private readonly configuration: TagSuggesterConfiguration,
    private readonly dependencies: TagSuggesterDependencies
  ) { }

  public suggest(prefix: string): readonly Suggestion[] {
    const { getTagsStartingWith, countFavoritesWithTag, tagCategoryResolver } = this.dependencies;
    return getTagsStartingWith(prefix)
      .map(tag => ({ tag, count: countFavoritesWithTag(tag) }))
      .toSorted((a, b) => b.count - a.count)
      .slice(0, this.configuration.maxSuggestionCount)
      .map(({ tag, count }) => ({
        text: tag,
        textClassName: findTextClassName(tagCategoryResolver.resolveCommon(tag)),
        acceptedText: `${tag} `,
        icon: "tag",
        detail: String(count)
      }));
  }
}

function findTextClassName(tagCategory: TagCategory | undefined): string | undefined {
  switch (tagCategory) {
    case "artist":
    case "character":
    case "copyright":
    case "metadata":
      return TagSuggesterClass[tagCategory];
    default:
      return undefined;
  }
}
