import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { TagAlignment, TagOrganization, TagSize } from "@/core/app/favorites/lightbox_details/view_options";
import { TagGroup, TagGroupCategory, groupTagsByCategory } from "@/core/app/favorites/lightbox_details/tag_groups";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { CopyIdButton } from "@/core/app/favorites/lightbox_details/copy_id_button";
import { Favorite } from "@/core/features/favorites/favorite";
import { LightboxButton } from "@/core/features/lightbox/ui/chrome/lightbox_button";
import { LightboxDetailsContent } from "@/core/features/lightbox/details/lightbox_details";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { Preference } from "@/core/utils/preference/preference";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { TagCategoryMap } from "@/core/domain/tag_category/tag_category";
import { h } from "@/core/ui/h/h";

export const FavoriteLightboxDetailsClass = {
  title: "fsg-FavoriteLightboxDetails-title",
  id: "fsg-FavoriteLightboxDetails-id",
  body: "fsg-FavoriteLightboxDetails-body",
  view: "fsg-FavoriteLightboxDetails-view",
  viewOption: "fsg-FavoriteLightboxDetails-viewOption",
  group: "fsg-FavoriteLightboxDetails-group",
  heading: "fsg-FavoriteLightboxDetails-heading",
  tags: "fsg-FavoriteLightboxDetails-tags",
  tag: "fsg-FavoriteLightboxDetails-tag",
  showMore: "fsg-FavoriteLightboxDetails-showMore"
} as const;

const COLLAPSED_TAG_COUNT = 6;

const HEADINGS: Readonly<Record<TagGroupCategory, string>> = {
  artist: "Artist",
  character: "Character",
  copyright: "Copyright",
  general: "General",
  metadata: "Meta"
};

const ORGANIZATION_CHOICES: readonly ControlChoice<TagOrganization>[] = [
  { value: "category", label: "By category", icon: "tagsGrouped" },
  { value: "list", label: "One list", icon: "tagsFlat" }
];
const ALIGNMENT_CHOICES: readonly ControlChoice<TagAlignment>[] = [
  { value: "start", label: "Left", icon: "alignLeft" },
  { value: "center", label: "Centered", icon: "alignCenter" }
];
const SIZE_CHOICES: readonly ControlChoice<TagSize>[] = [
  { value: "small", label: "Small", icon: "textSmall" },
  { value: "medium", label: "Medium", icon: "textMedium" },
  { value: "large", label: "Large", icon: "textLarge" }
];

export interface FavoriteLightboxDetailsView {
  readonly organization: Preference<TagOrganization>;
  readonly alignment: Preference<TagAlignment>;
  readonly size: Preference<TagSize>;
}

export interface FavoriteLightboxDetailsProps {
  favorite: Readable<Pick<Favorite, "id" | "tags"> | undefined>;
  view: FavoriteLightboxDetailsView;
  localTagCategories: Pick<LocalTagCategories, "getMany">;
  clipboard: Pick<Clipboard, "write">;
  scheduler: Pick<Scheduler, "schedule">;
}

export function createFavoriteLightboxDetails(props: FavoriteLightboxDetailsProps): LightboxDetailsContent {
  const viewOpen = new Signal(false);
  return {
    title: <FavoriteLightboxTitle {...props} viewOpen={viewOpen} />,
    controls: <FavoriteLightboxViewSettings {...props} viewOpen={viewOpen} />,
    body: <FavoriteLightboxBody {...props} viewOpen={viewOpen} />
  };
}

type PartProps = FavoriteLightboxDetailsProps & { viewOpen: Signal<boolean> };

function FavoriteLightboxTitle({ favorite, clipboard, scheduler, viewOpen }: PartProps): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.title}>
      <h2 className={FavoriteLightboxDetailsClass.id}>
        <CopyIdButton id={computed(() => favorite.value?.id)} clipboard={clipboard} scheduler={scheduler} />
      </h2>
      <LightboxButton icon="tune" label="View settings" pressed={viewOpen} onClick={() => {
        viewOpen.value = !viewOpen.value;
      }} />
    </div>
  ) as HTMLElement;
}

function ViewOption<T>({ label, choices, preference }: { label: string; choices: readonly ControlChoice<T>[]; preference: Preference<T> }): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.viewOption} role="group" aria-label={label}>
      <Segmented choices={choices} value={preference} onValueChange={next => preference.set(next)} />
    </div>
  ) as HTMLElement;
}

function FavoriteLightboxViewSettings({ view, viewOpen }: PartProps): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.view} role="group" aria-label="View settings" hidden={computed(() => !viewOpen.value)}>
      <ViewOption label="Organization" choices={ORGANIZATION_CHOICES} preference={view.organization} />
      <ViewOption label="Alignment" choices={ALIGNMENT_CHOICES} preference={view.alignment} />
      <ViewOption label="Size" choices={SIZE_CHOICES} preference={view.size} />
    </div>
  ) as HTMLElement;
}

function FavoriteLightboxBody({ favorite, view, localTagCategories }: PartProps): HTMLElement {
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
    const organization = view.organization.value;

    shown?.dispose();
    shown = createGroupsScope(() => renderGroups(shownGroups, organization));
    groupList.replaceChildren(...shown.result);
  });
  onCleanup(() => shown?.dispose());
  return (
    <div
      className={FavoriteLightboxDetailsClass.body}
      dataset={{ alignment: view.alignment, size: view.size }}
    >
      {groupList}
    </div>
  ) as HTMLElement;
}

function renderGroups(groups: readonly TagGroup[], organization: TagOrganization): HTMLElement[] {
  if (organization === "category") {
    return groups.map(group => <TagGroupSection group={group} />);
  }
  return groups.length === 0 ? [] : [<TagList tags={groups.flatMap(group => group.tags).sort()} />];
}

function TagGroupSection({ group }: { group: TagGroup }): HTMLElement {
  const expanded = new Signal(group.tags.length <= COLLAPSED_TAG_COUNT);
  const hiddenCount = group.tags.length - COLLAPSED_TAG_COUNT;
  return (
    <section className={FavoriteLightboxDetailsClass.group}>
      <h3 className={FavoriteLightboxDetailsClass.heading}>{HEADINGS[group.category]}</h3>
      <ul className={FavoriteLightboxDetailsClass.tags}>
        {group.tags.map((tag, index) => (
          <li className={FavoriteLightboxDetailsClass.tag} hidden={index < COLLAPSED_TAG_COUNT ? false : computed(() => !expanded.value)}>{tag}</li>
        ))}
        <li hidden={expanded}>
          <button type="button" className={FavoriteLightboxDetailsClass.showMore} onClick={() => {
            expanded.value = true;
          }}>
            {`Show ${hiddenCount} more`}
          </button>
        </li>
      </ul>
    </section>
  ) as HTMLElement;
}

function TagList({ tags }: { tags: readonly string[] }): HTMLElement {
  return (
    <section className={FavoriteLightboxDetailsClass.group}>
      <ul className={FavoriteLightboxDetailsClass.tags}>
        {tags.map(tag => <li className={FavoriteLightboxDetailsClass.tag}>{tag}</li>)}
      </ul>
    </section>
  ) as HTMLElement;
}
