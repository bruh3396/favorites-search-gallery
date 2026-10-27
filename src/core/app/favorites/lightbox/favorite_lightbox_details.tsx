import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { TagAlignment } from "@/core/app/favorites/lightbox/tag_alignment";
import { TagOrganization } from "@/core/app/favorites/lightbox/tag_organization";
import { TagSize } from "@/core/app/favorites/lightbox/tag_size";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { CopyIdButton } from "@/core/app/favorites/lightbox/copy_id_button";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteLightboxTags } from "@/core/app/favorites/lightbox/favorite_lightbox_tags";
import { LightboxButton } from "@/core/features/lightbox/ui/chrome/lightbox_button";
import { LightboxDetailsContent } from "@/core/features/lightbox/details/lightbox_details";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { h } from "@/core/ui/h/h";

export const FavoriteLightboxDetailsClass = {
  title: "fsg-FavoriteLightboxDetails-title",
  id: "fsg-FavoriteLightboxDetails-id",
  view: "fsg-FavoriteLightboxDetails-view",
  viewOption: "fsg-FavoriteLightboxDetails-viewOption"
} as const;

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

export interface FavoriteLightboxTagsPreferences {
  readonly organization: StoredValue<TagOrganization>;
  readonly alignment: StoredValue<TagAlignment>;
  readonly size: StoredValue<TagSize>;
}

export interface FavoriteLightboxDetailsProps {
  favorite: Readable<Pick<Favorite, "id" | "tags"> | undefined>;
  tagsPreferences: FavoriteLightboxTagsPreferences;
  localTagCategories: Pick<LocalTagCategories, "getMany">;
  clipboard: Pick<Clipboard, "write">;
  scheduler: Pick<Scheduler, "schedule">;
  copiedDuration: number;
  collapsedTagCount: number;
}

export function createFavoriteLightboxDetails(props: FavoriteLightboxDetailsProps): LightboxDetailsContent {
  const { favorite, tagsPreferences, localTagCategories, collapsedTagCount } = props;
  const viewOpen = new Signal(false);
  return {
    title: <FavoriteLightboxTitle {...props} viewOpen={viewOpen} />,
    controls: <FavoriteLightboxViewSettings {...props} viewOpen={viewOpen} />,
    body: <FavoriteLightboxTags favorite={favorite} {...tagsPreferences} localTagCategories={localTagCategories} collapsedTagCount={collapsedTagCount} />
  };
}

type PartProps = FavoriteLightboxDetailsProps & { viewOpen: Signal<boolean> };

function FavoriteLightboxTitle({ favorite, clipboard, scheduler, copiedDuration, viewOpen }: PartProps): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.title}>
      <h2 className={FavoriteLightboxDetailsClass.id}>
        <CopyIdButton id={computed(() => favorite.value?.id)} clipboard={clipboard} scheduler={scheduler} copiedDuration={copiedDuration} />
      </h2>
      <LightboxButton icon="tune" label="View settings" pressed={viewOpen} onClick={() => {
        viewOpen.value = !viewOpen.value;
      }} />
    </div>
  ) as HTMLElement;
}

function ViewOption<T>({ label, choices, preference }: { label: string; choices: readonly ControlChoice<T>[]; preference: StoredValue<T> }): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.viewOption} role="group" aria-label={label}>
      <Segmented choices={choices} value={preference} onValueChange={next => preference.set(next)} />
    </div>
  ) as HTMLElement;
}

function FavoriteLightboxViewSettings({ tagsPreferences, viewOpen }: PartProps): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.view} role="group" aria-label="View settings" hidden={computed(() => !viewOpen.value)}>
      <ViewOption label="Organization" choices={ORGANIZATION_CHOICES} preference={tagsPreferences.organization} />
      <ViewOption label="Alignment" choices={ALIGNMENT_CHOICES} preference={tagsPreferences.alignment} />
      <ViewOption label="Size" choices={SIZE_CHOICES} preference={tagsPreferences.size} />
    </div>
  ) as HTMLElement;
}
