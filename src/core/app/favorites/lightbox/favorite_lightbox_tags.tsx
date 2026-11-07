import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { Favorite } from "@/core/features/favorites/favorite";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { TagAlignment } from "@/core/app/favorites/lightbox/tag_alignment";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { TagOrganization } from "@/core/app/favorites/lightbox/tag_organization";
import { TagSize } from "@/core/app/favorites/lightbox/tag_size";
import { h } from "@/core/ui/h/h";

export const FavoriteLightboxTagsClass = {
  root: "fsg-FavoriteLightboxTags",
  group: "fsg-FavoriteLightboxTags-group",
  heading: "fsg-FavoriteLightboxTags-heading",
  list: "fsg-FavoriteLightboxTags-list",
  tag: "fsg-FavoriteLightboxTags-tag",
  showMore: "fsg-FavoriteLightboxTags-showMore"
} as const;

const GROUP_ORDER = ["artist", "character", "copyright", "metadata", "general"] as const;

type TagGroupCategory = typeof GROUP_ORDER[number];

interface TagGroup {
  readonly category: TagGroupCategory;
  readonly tags: readonly string[];
}

const HEADINGS: Readonly<Record<TagGroupCategory, string>> = {
  artist: "Artist",
  character: "Character",
  copyright: "Copyright",
  general: "General",
  metadata: "Meta"
};

export interface FavoriteLightboxTagsProps {
  favorite: Readable<Pick<Favorite, "tags"> | undefined>;
  organization: Readable<TagOrganization>;
  alignment: Readable<TagAlignment>;
  size: Readable<TagSize>;
  localTagCategories: Pick<LocalTagCategories, "getMany">;
  collapsedTagCount: number;
}

export function FavoriteLightboxTags({
  favorite,
  organization,
  alignment,
  size,
  localTagCategories,
  collapsedTagCount
}: FavoriteLightboxTagsProps): HTMLElement {
  const groups = new Signal<readonly TagGroup[]>([]);
  const groupList = <div />;
  const createGroupsScope = captureScope();
  let shown: Scoped<HTMLElement[]> | undefined;

  effect(() => {
    const currentFavorite = favorite.value;
    const showGroups = (categories: ReadonlyMap<string, TagCategory>): void => {
      if (favorite.peek() === currentFavorite && currentFavorite !== undefined) {
        groups.value = groupTagsByCategory(currentFavorite.tags, categories);
      }
    };

    groups.value = [];

    if (currentFavorite !== undefined) {
      localTagCategories.getMany([...currentFavorite.tags]).then(showGroups, (error: unknown) => {
        console.error(error);
        showGroups(new Map());
      });
    }
  });
  effect(() => {
    const currentGroups = groups.value;
    const shownOrganization = organization.value;

    shown?.dispose();
    shown = createGroupsScope(() => renderGroups(currentGroups, shownOrganization, collapsedTagCount));
    groupList.replaceChildren(...shown.result);
  });
  onCleanup(() => shown?.dispose());
  return (
    <div className={FavoriteLightboxTagsClass.root} dataset={{ alignment, size }}>
      {groupList}
    </div>
  ) as HTMLElement;
}

function groupTagsByCategory(tags: Iterable<string>, categories: ReadonlyMap<string, TagCategory>): TagGroup[] {
  const tagList = [...tags];
  return GROUP_ORDER
    .map(category => ({ category, tags: tagList.filter(tag => toGroupCategory(categories.get(tag)) === category).sort() }))
    .filter(group => group.tags.length > 0);
}

function toGroupCategory(category: TagCategory | undefined): TagGroupCategory {
  return category === undefined || category === "unknown" ? "general" : category;
}

function renderGroups(tagGroups: readonly TagGroup[], organization: TagOrganization, collapsedTagCount: number): HTMLElement[] {
  if (organization === "category") {
    return tagGroups.map(tagGroup => <TagGroupSection tagGroup={tagGroup} collapsedTagCount={collapsedTagCount} />);
  }
  return tagGroups.length === 0 ? [] : [<TagList tags={tagGroups.flatMap(tagGroup => tagGroup.tags).sort()} />];
}

function TagGroupSection({ tagGroup, collapsedTagCount }: { tagGroup: TagGroup; collapsedTagCount: number }): HTMLElement {
  const expanded = new Signal(tagGroup.tags.length <= collapsedTagCount);
  const hiddenCount = tagGroup.tags.length - collapsedTagCount;
  return (
    <section className={FavoriteLightboxTagsClass.group}>
      <h3 className={FavoriteLightboxTagsClass.heading}>{HEADINGS[tagGroup.category]}</h3>
      <ul className={FavoriteLightboxTagsClass.list}>
        {tagGroup.tags.map((tag, index) => (
          <li className={FavoriteLightboxTagsClass.tag} hidden={index < collapsedTagCount ? false : computed(() => !expanded.value)}>{tag}</li>
        ))}
        <li hidden={expanded}>
          <button type="button" className={FavoriteLightboxTagsClass.showMore} onClick={() => {
            expanded.value = true;
          }}>
            {`Show ${hiddenCount} More`}
          </button>
        </li>
      </ul>
    </section>
  ) as HTMLElement;
}

function TagList({ tags }: { tags: readonly string[] }): HTMLElement {
  return (
    <section className={FavoriteLightboxTagsClass.group}>
      <ul className={FavoriteLightboxTagsClass.list}>
        {tags.map(tag => <li className={FavoriteLightboxTagsClass.tag}>{tag}</li>)}
      </ul>
    </section>
  ) as HTMLElement;
}
