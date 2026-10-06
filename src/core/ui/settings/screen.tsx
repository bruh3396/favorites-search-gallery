import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { SettingDescriptor, SettingPreference } from "@/core/ui/settings/descriptor";
import { indexSettings, matchSettings, splitQuery } from "@/core/ui/settings/search";
import { ControlSize } from "@/core/ui/components/control";
import { Disclosure } from "@/core/ui/components/disclosure/disclosure";
import { Setting } from "@/core/ui/settings/setting";
import { StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { h } from "@/core/ui/h/h";

export const SettingsScreenClass = {
  root: "fsg-SettingsScreen"
} as const;

export interface SettingSection {
  id: string;
  title: string;
  settings: readonly string[];
}

export type SettingsLayout = readonly SettingSection[];

export interface SettingsScreenProps {
  layout: SettingsLayout;
  descriptors: readonly SettingDescriptor[];
  expanded: SettingPreference<readonly string[]>;
  descriptionsVisible?: Readable<boolean>;
  query?: Readable<string>;
  size?: ControlSize;
  scheduler: StepperScheduler;
}

interface SectionProps {
  section: SettingSection;
  descriptors: readonly SettingDescriptor[];
  expanded: SettingPreference<readonly string[]>;
  searching: Readable<boolean>;
  matches: Readable<ReadonlySet<string>>;
  descriptionsVisible: Readable<boolean> | undefined;
  size: ControlSize;
  scheduler: StepperScheduler;
}

export function SettingsScreen({
  layout,
  descriptors,
  expanded,
  descriptionsVisible,
  query,
  size = "medium",
  scheduler
}: SettingsScreenProps): HTMLElement {
  const descriptorsById = new Map(descriptors.map(descriptor => [descriptor.id, descriptor]));
  const sectionsWithSettings = layout
    .map(section => ({ section, title: section.title, descriptors: section.settings.map(id => getDescriptor(descriptorsById, id)) }))
    .filter(entry => entry.descriptors.length > 0);
  const index = indexSettings(sectionsWithSettings);
  const terms = computed(() => splitQuery(query?.value ?? ""));
  const searching = computed(() => terms.value.length > 0);
  const matches = computed(() => matchSettings(index, terms.value));
  return (
    <div className={SettingsScreenClass.root}>
      {sectionsWithSettings.map(entry => (
        <Section
          section={entry.section}
          descriptors={entry.descriptors}
          expanded={expanded}
          searching={searching}
          matches={matches}
          descriptionsVisible={descriptionsVisible}
          size={size}
          scheduler={scheduler}
        />
      ))}
    </div>
  );
}

function Section({ section, descriptors, expanded, searching, matches, descriptionsVisible, size, scheduler }: SectionProps): HTMLElement {
  const settings = descriptors.map(descriptor => (
    <Setting descriptor={descriptor} descriptionVisible={descriptionsVisible} size={size} scheduler={scheduler} />
  ));
  const openWhileSearching = new Signal(true);
  const open = computed(() => (searching.value ? openWhileSearching.value : expanded.value.includes(section.id)));
  const setSectionOpen = (next: boolean): void => {
    if (searching.peek()) {
      openWhileSearching.value = next;
    } else {
      expanded.set(updateOpenSectionIds(expanded.peek(), { id: section.id, open: next }));
    }
  };
  const element = <Disclosure title={section.title} content={<div>{settings}</div>} value={open} size={size} onValueChange={setSectionOpen} />;
  const showMatches = (shown: ReadonlySet<string>): void => {
    settings.forEach((setting, position) => {
      setting.hidden = !shown.has(descriptors[position].id);
    });
    element.hidden = !descriptors.some(descriptor => shown.has(descriptor.id));
    openWhileSearching.value = true;
  };

  effect(() => showMatches(matches.value));
  return element;
}

function getDescriptor(descriptorsById: ReadonlyMap<string, SettingDescriptor>, id: string): SettingDescriptor {
  const descriptor = descriptorsById.get(id);

  if (descriptor === undefined) {
    throw new Error(`The layout names a setting with no descriptor: "${id}"`);
  }
  return descriptor;
}

function updateOpenSectionIds(ids: readonly string[], { id, open }: { id: string; open: boolean }): readonly string[] {
  const others = ids.filter(other => other !== id);
  return open ? [...others, id] : others;
}
