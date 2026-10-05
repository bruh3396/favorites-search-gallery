import { Setting, SettingSize, createSetting } from "@/core/ui/settings/setting";
import { SettingDescriptor, SettingPreference } from "@/core/ui/settings/descriptor";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { indexSettings, matchSettings, splitQuery } from "@/core/ui/settings/search";
import { StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { createDisclosure } from "@/core/ui/components/disclosure/disclosure";

export const SettingsScreenClass = {
  root: "fsg-SettingsScreen"
} as const;

export interface SettingSection {
  id: string;
  title: string;
  settings: readonly string[];
}

export type SettingsLayout = readonly SettingSection[];

export interface SettingsScreenOptions {
  layout: SettingsLayout;
  descriptors: readonly SettingDescriptor[];
  expanded: SettingPreference<readonly string[]>;
  size?: SettingSize;
  scheduler: StepperScheduler;
}

export interface SettingsScreen {
  readonly element: HTMLDivElement;
  setDescriptionsVisible: (visible: boolean) => void;
  setQuery: (query: string) => void;
  dispose: () => void;
}

interface SectionOptions {
  section: SettingSection;
  descriptors: readonly SettingDescriptor[];
  expanded: SettingPreference<readonly string[]>;
  searching: Signal<boolean>;
  size: SettingSize;
  scheduler: StepperScheduler;
}

interface Section {
  readonly element: HTMLElement;
  readonly settings: readonly Setting[];
  showMatches: (matches: ReadonlySet<string>) => void;
  dispose: () => void;
}

export function createSettingsScreen(
  ownerDocument: Document,
  { layout, descriptors, expanded, size = "medium", scheduler }: SettingsScreenOptions
): SettingsScreen {
  const element = ownerDocument.createElement("div");
  const descriptorsById = new Map(descriptors.map(descriptor => [descriptor.id, descriptor]));
  const searching = new Signal(false);
  const populatedSections = layout
    .map(section => ({ section, title: section.title, descriptors: section.settings.map(id => findDescriptor(descriptorsById, id)) }))
    .filter(entry => entry.descriptors.length > 0);
  const index = indexSettings(populatedSections);
  const sections = populatedSections.map(entry => createSection(ownerDocument, { ...entry, expanded, searching, size, scheduler }));
  const settings = sections.flatMap(section => section.settings);

  element.className = SettingsScreenClass.root;
  element.append(...sections.map(section => section.element));
  return {
    element,
    setDescriptionsVisible: (visible): void => settings.forEach(setting => setting.setDescriptionVisible(visible)),
    setQuery: (query): void => {
      const terms = splitQuery(query);
      const matches = matchSettings(index, terms);

      sections.forEach(section => section.showMatches(matches));
      searching.value = terms.length > 0;
    },
    dispose: (): void => sections.forEach(section => section.dispose())
  };
}

function createSection(ownerDocument: Document, { section, descriptors, expanded, searching, size, scheduler }: SectionOptions): Section {
  const content = ownerDocument.createElement("div");
  const settings = descriptors.map(descriptor => createSetting(ownerDocument, { descriptor, size, scheduler }));
  const openWhileSearching = new Signal(true);
  const writeOpen = (open: boolean): void => {
    if (searching.value) {
      openWhileSearching.value = open;
    } else {
      expanded.set(updateOpenSectionIds(expanded.value, { id: section.id, open }));
    }
  };
  const disclosure = createDisclosure(ownerDocument, { title: section.title, content, size, onValueChange: writeOpen });
  const stopShowingOpen = effect(() => disclosure.setValue(searching.value ? openWhileSearching.value : expanded.value.includes(section.id)));

  content.append(...settings.map(setting => setting.element));
  return {
    element: disclosure.element,
    settings,
    showMatches: (matches): void => {
      settings.forEach((setting, position) => {
        setting.element.hidden = !matches.has(descriptors[position].id);
      });
      disclosure.element.hidden = !descriptors.some(descriptor => matches.has(descriptor.id));
      openWhileSearching.value = true;
    },
    dispose: (): void => {
      stopShowingOpen();
      settings.forEach(setting => setting.dispose());
    }
  };
}

function findDescriptor(descriptorsById: ReadonlyMap<string, SettingDescriptor>, id: string): SettingDescriptor {
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
