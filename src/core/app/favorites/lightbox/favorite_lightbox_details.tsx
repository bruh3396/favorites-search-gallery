import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { CopyIdButton } from "@/core/app/favorites/lightbox/copy_id_button";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteLightboxTags } from "@/core/app/favorites/lightbox/favorite_lightbox_tags";
import { LightboxButton } from "@/core/features/lightbox/ui/chrome/lightbox_button";
import { LightboxDetailsContent } from "@/core/features/lightbox/details/lightbox_details";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { TagAlignment } from "@/core/app/favorites/lightbox/tag_alignment";
import { TagOrganization } from "@/core/app/favorites/lightbox/tag_organization";
import { TagSize } from "@/core/app/favorites/lightbox/tag_size";
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

export interface FavoriteLightboxDetailsPreferences {
  readonly organization: StoredValue<TagOrganization>;
  readonly alignment: StoredValue<TagAlignment>;
  readonly size: StoredValue<TagSize>;
}

export interface FavoriteLightboxDetailsProps {
  favorite: Readable<Pick<Favorite, "id" | "tags"> | undefined>;
  preferences: FavoriteLightboxDetailsPreferences;
  localTagCategories: Pick<LocalTagCategories, "getMany">;
  clipboard: Pick<Clipboard, "write">;
  scheduler: Pick<Scheduler, "schedule">;
  copiedDuration: number;
  collapsedTagCount: number;
}

export function createFavoriteLightboxDetails(props: FavoriteLightboxDetailsProps): LightboxDetailsContent {
  const { favorite, preferences: favoriteLightboxDetailsPreferences, localTagCategories, collapsedTagCount } = props;
  const viewOpen = new Signal(false);
  return {
    titleChild: <FavoriteLightboxTitle {...props} viewOpen={viewOpen} />,
    controlsChild: <FavoriteLightboxViewSettings {...props} viewOpen={viewOpen} />,
    bodyChild: <FavoriteLightboxTags
      favorite={favorite}
      {...favoriteLightboxDetailsPreferences}
      localTagCategories={localTagCategories}
      collapsedTagCount={collapsedTagCount}
    />
  };
}

type PartProps = FavoriteLightboxDetailsProps & { viewOpen: Signal<boolean> };

function FavoriteLightboxTitle({ favorite, clipboard, scheduler, copiedDuration, viewOpen }: PartProps): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.title}>
      <h2 className={FavoriteLightboxDetailsClass.id}>
        <CopyIdButton postId={computed(() => favorite.value?.id)} clipboard={clipboard} scheduler={scheduler} copiedDuration={copiedDuration} />
      </h2>
      <LightboxButton icon="tune" label="View settings" pressed={viewOpen} onClick={() => {
        viewOpen.value = !viewOpen.value;
      }} />
    </div>
  ) as HTMLElement;
}

function ViewOption<Value>({ label, controlChoices, value }: {
  label: string;
  controlChoices: readonly ControlChoice<Value>[];
  value: StoredValue<Value>;
}): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.viewOption} role="group" aria-label={label}>
      <Segmented controlChoices={controlChoices} value={value} onValueChange={nextValue => value.set(nextValue)} />
    </div>
  ) as HTMLElement;
}

function FavoriteLightboxViewSettings({ preferences: favoriteLightboxDetailsPreferences, viewOpen }: PartProps): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.view} role="group" aria-label="View settings" hidden={computed(() => !viewOpen.value)}>
      <ViewOption label="Organization" controlChoices={ORGANIZATION_CHOICES} value={favoriteLightboxDetailsPreferences.organization} />
      <ViewOption label="Alignment" controlChoices={ALIGNMENT_CHOICES} value={favoriteLightboxDetailsPreferences.alignment} />
      <ViewOption label="Size" controlChoices={SIZE_CHOICES} value={favoriteLightboxDetailsPreferences.size} />
    </div>
  ) as HTMLElement;
}
