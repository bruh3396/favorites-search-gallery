import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { SettingDescriptor, SettingPreference } from "@/core/ui/settings/descriptor";
import { indexSettings, matchSettings, splitQuery } from "@/core/ui/settings/search";
import { ControlSize } from "@/core/ui/components/control";
import { StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { createDisclosure } from "@/core/ui/components/disclosure/disclosure";
import { createSetting } from "@/core/ui/settings/setting";
import { doNothing } from "@/core/utils/function/function";

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
  descriptionsVisible?: Readable<boolean>;
  query?: Readable<string>;
  size?: ControlSize;
  scheduler: StepperScheduler;
}

export interface SettingsScreen {
  readonly element: HTMLDivElement;
  dispose: () => void;
}

interface SectionOptions {
  section: SettingSection;
  descriptors: readonly SettingDescriptor[];
  expanded: SettingPreference<readonly string[]>;
  searching: Readable<boolean>;
  descriptionsVisible: Readable<boolean> | undefined;
  size: ControlSize;
  scheduler: StepperScheduler;
}

interface Section {
  readonly element: HTMLElement;
  showMatches: (matches: ReadonlySet<string>) => void;
  dispose: () => void;
}

export function createSettingsScreen(
  ownerDocument: Document,
  { layout, descriptors, expanded, descriptionsVisible, query, size = "medium", scheduler }: SettingsScreenOptions
): SettingsScreen {
  const element = ownerDocument.createElement("div");
  const descriptorsById = new Map(descriptors.map(descriptor => [descriptor.id, descriptor]));
  const searching = new Signal(false);
  const sectionsWithSettings = layout
    .map(section => ({ section, title: section.title, descriptors: section.settings.map(id => getDescriptor(descriptorsById, id)) }))
    .filter(entry => entry.descriptors.length > 0);
  const index = indexSettings(sectionsWithSettings);
  const sections = sectionsWithSettings.map(entry => createSection(ownerDocument, { ...entry, expanded, searching, descriptionsVisible, size, scheduler }));
  const filterSections = (text: string): void => {
    const terms = splitQuery(text);
    const matches = matchSettings(index, terms);

    sections.forEach(section => section.showMatches(matches));
    searching.value = terms.length > 0;
  };
  const disposeQuery = query === undefined ? doNothing : effect(() => filterSections(query.value));

  element.className = SettingsScreenClass.root;
  element.append(...sections.map(section => section.element));
  return {
    element,
    dispose: (): void => {
      disposeQuery();
      sections.forEach(section => section.dispose());
    }
  };
}

function createSection(
  ownerDocument: Document,
  { section, descriptors, expanded, searching, descriptionsVisible, size, scheduler }: SectionOptions
): Section {
  const content = ownerDocument.createElement("div");
  const settings = descriptors.map(descriptor => createSetting(ownerDocument, { descriptor, descriptionVisible: descriptionsVisible, size, scheduler }));
  const openWhileSearching = new Signal(true);
  const open = computed(() => (searching.value ? openWhileSearching.value : expanded.value.includes(section.id)));
  const setSectionOpen = (next: boolean): void => {
    if (searching.peek()) {
      openWhileSearching.value = next;
    } else {
      expanded.set(updateOpenSectionIds(expanded.peek(), { id: section.id, open: next }));
    }
  };
  const disclosure = createDisclosure(ownerDocument, { title: section.title, content, value: open, size, onValueChange: setSectionOpen });

  content.append(...settings.map(setting => setting.element));
  return {
    element: disclosure.element,
    showMatches: (matches): void => {
      settings.forEach((setting, position) => {
        setting.element.hidden = !matches.has(descriptors[position].id);
      });
      disclosure.element.hidden = !descriptors.some(descriptor => matches.has(descriptor.id));
      openWhileSearching.value = true;
    },
    dispose: (): void => {
      disclosure.dispose();
      settings.forEach(setting => setting.dispose());
    }
  };
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
