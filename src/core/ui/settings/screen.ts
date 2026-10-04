import { Setting, SettingSize, createSetting } from "@/core/ui/settings/setting";
import { SettingDescriptor, SettingPreference } from "@/core/ui/settings/descriptor";
import { StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { createDisclosure } from "@/core/ui/components/disclosure/disclosure";
import { effect } from "@/core/utils/reactive/signal";

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
  dispose: () => void;
}

interface SectionOptions {
  section: SettingSection;
  descriptors: readonly SettingDescriptor[];
  expanded: SettingPreference<readonly string[]>;
  size: SettingSize;
  scheduler: StepperScheduler;
}

interface Section {
  readonly element: HTMLElement;
  readonly settings: readonly Setting[];
  dispose: () => void;
}

export function createSettingsScreen(
  ownerDocument: Document,
  { layout, descriptors, expanded, size = "medium", scheduler }: SettingsScreenOptions
): SettingsScreen {
  const element = ownerDocument.createElement("div");
  const descriptorsById = new Map(descriptors.map(descriptor => [descriptor.id, descriptor]));
  const sections = layout
    .map(section => ({ section, descriptors: section.settings.map(id => descriptorFor(descriptorsById, id)) }))
    .filter(entry => entry.descriptors.length > 0)
    .map(entry => createSection(ownerDocument, { ...entry, expanded, size, scheduler }));
  const settings = sections.flatMap(section => section.settings);

  element.className = SettingsScreenClass.root;
  element.append(...sections.map(section => section.element));
  return {
    element,
    setDescriptionsVisible: (visible): void => settings.forEach(setting => setting.setDescriptionVisible(visible)),
    dispose: (): void => sections.forEach(section => section.dispose())
  };
}

function createSection(ownerDocument: Document, { section, descriptors, expanded, size, scheduler }: SectionOptions): Section {
  const content = ownerDocument.createElement("div");
  const settings = descriptors.map(descriptor => createSetting(ownerDocument, { descriptor, size, scheduler }));
  const disclosure = createDisclosure(ownerDocument, {
    title: section.title,
    content,
    size,
    onValueChange: open => expanded.set(toggled(expanded.value, { id: section.id, open }))
  });
  const stopShowingOpen = effect(() => disclosure.setValue(expanded.value.includes(section.id)));

  content.append(...settings.map(setting => setting.element));
  return {
    element: disclosure.element,
    settings,
    dispose: (): void => {
      stopShowingOpen();
      settings.forEach(setting => setting.dispose());
    }
  };
}

function descriptorFor(descriptorsById: ReadonlyMap<string, SettingDescriptor>, id: string): SettingDescriptor {
  const descriptor = descriptorsById.get(id);

  if (descriptor === undefined) {
    throw new Error(`The layout names a setting with no descriptor: "${id}"`);
  }
  return descriptor;
}

function toggled(ids: readonly string[], { id, open }: { id: string; open: boolean }): readonly string[] {
  const others = ids.filter(other => other !== id);
  return open ? [...others, id] : others;
}
