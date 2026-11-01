import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { LightboxButton } from "@/core/features/lightbox/overlay/lightbox_button";
import { LightboxDetailsContent } from "@/core/features/lightbox/details/lightbox_details";
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
  preferences: FavoriteLightboxDetailsPreferences;
  copyIdButton: Node;
  tags: Node;
}

export function createFavoriteLightboxDetails({
  preferences: favoriteLightboxDetailsPreferences,
  copyIdButton,
  tags
}: FavoriteLightboxDetailsProps): LightboxDetailsContent {
  const viewOpen = new Signal(false);
  return {
    titleChild: <FavoriteLightboxTitle copyIdButton={copyIdButton} viewOpen={viewOpen} />,
    controlsChild: <FavoriteLightboxViewSettings favoriteLightboxDetailsPreferences={favoriteLightboxDetailsPreferences} viewOpen={viewOpen} />,
    bodyChild: tags
  };
}

function FavoriteLightboxTitle({ copyIdButton, viewOpen }: { copyIdButton: Node; viewOpen: Signal<boolean> }): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.title}>
      <h2 className={FavoriteLightboxDetailsClass.id}>
        {copyIdButton}
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

interface FavoriteLightboxViewSettingsProps {
  favoriteLightboxDetailsPreferences: FavoriteLightboxDetailsPreferences;
  viewOpen: Readable<boolean>;
}

function FavoriteLightboxViewSettings({ favoriteLightboxDetailsPreferences, viewOpen }: FavoriteLightboxViewSettingsProps): HTMLElement {
  return (
    <div className={FavoriteLightboxDetailsClass.view} role="group" aria-label="View settings" hidden={computed(() => !viewOpen.value)}>
      <ViewOption label="Organization" controlChoices={ORGANIZATION_CHOICES} value={favoriteLightboxDetailsPreferences.organization} />
      <ViewOption label="Alignment" controlChoices={ALIGNMENT_CHOICES} value={favoriteLightboxDetailsPreferences.alignment} />
      <ViewOption label="Size" controlChoices={SIZE_CHOICES} value={favoriteLightboxDetailsPreferences.size} />
    </div>
  ) as HTMLElement;
}
