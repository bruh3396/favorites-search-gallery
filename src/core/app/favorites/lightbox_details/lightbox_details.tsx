import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { TagGroup, TagGroupCategory, groupTagsByCategory } from "@/core/app/favorites/lightbox_details/tag_groups";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { CopyIdButton } from "@/core/app/favorites/lightbox_details/copy_id_button";
import { Favorite } from "@/core/features/favorites/favorite";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { h } from "@/core/ui/h/h";

export const FavoriteLightboxDetailsClass = {
  id: "fsg-FavoriteLightboxDetails-id",
  group: "fsg-FavoriteLightboxDetails-group",
  heading: "fsg-FavoriteLightboxDetails-heading",
  tags: "fsg-FavoriteLightboxDetails-tags",
  tag: "fsg-FavoriteLightboxDetails-tag"
} as const;

const HEADINGS: Readonly<Record<TagGroupCategory, string>> = {
  artist: "Artist",
  character: "Character",
  copyright: "Copyright",
  general: "General",
  metadata: "Meta"
};

export interface FavoriteLightboxDetailsProps {
  favorite: Readable<Pick<Favorite, "id" | "tags"> | undefined>;
  localTagCategories: Pick<LocalTagCategories, "getMany">;
  clipboard: Pick<Clipboard, "write">;
  scheduler: Pick<Scheduler, "schedule">;
}

export function FavoriteLightboxDetails({ favorite, localTagCategories, clipboard, scheduler }: FavoriteLightboxDetailsProps): HTMLElement {
  const groups = new Signal<readonly TagGroup[]>([]);
  const groupList = <div />;
  const createGroupsScope = captureScope();
  let shown: Scoped<HTMLElement[]> | undefined;

  effect(() => {
    const isShown = favorite.value;
    const showGroups = (categories: TagCategoryMap): void => {
      if (favorite.peek() === isShown && isShown !== undefined) {
        groups.value = groupTagsByCategory(isShown.tags, categories);
      }
    };

    groups.value = [];

    if (isShown !== undefined) {
      localTagCategories.getMany([...isShown.tags]).then(showGroups, (error: unknown) => {
        console.error(error);
        showGroups(new Map());
      });
    }
  });
  effect(() => {
    const shownGroups = groups.value;

    shown?.dispose();
    shown = createGroupsScope(() => shownGroups.map(group => <TagGroupSection group={group} />));
    groupList.replaceChildren(...shown.result);
  });
  onCleanup(() => shown?.dispose());
  return (
    <div>
      <h2 className={FavoriteLightboxDetailsClass.id}>
        <CopyIdButton id={computed(() => favorite.value?.id)} clipboard={clipboard} scheduler={scheduler} />
      </h2>
      {groupList}
    </div>
  ) as HTMLElement;
}

function TagGroupSection({ group }: { group: TagGroup }): HTMLElement {
  return (
    <section className={FavoriteLightboxDetailsClass.group}>
      <h3 className={FavoriteLightboxDetailsClass.heading}>{HEADINGS[group.category]}</h3>
      <ul className={FavoriteLightboxDetailsClass.tags}>
        {group.tags.map(tag => <li className={FavoriteLightboxDetailsClass.tag}>{tag}</li>)}
      </ul>
    </section>
  ) as HTMLElement;
}
