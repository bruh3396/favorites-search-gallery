import { SettingDescriptor } from "@/core/ui/settings/descriptor";

export interface SearchableSection {
  title: string;
  descriptors: readonly SettingDescriptor[];
}

export type SettingsIndex = ReadonlyMap<string, string>;

export function indexSettings(sections: readonly SearchableSection[]): SettingsIndex {
  const entries = sections.flatMap(({ title, descriptors }) => descriptors.map(descriptor => [descriptor.id, collectSearchText(descriptor, title)] as const));
  return new Map(entries);
}

export function splitQuery(query: string): string[] {
  return query.toLowerCase().split(/\s+/u).filter(term => term !== "");
}

export function matchSettings(index: SettingsIndex, terms: readonly string[]): ReadonlySet<string> {
  return new Set([...index].filter(([, text]) => terms.every(term => text.includes(term))).map(([id]) => id));
}

function collectSearchText(descriptor: SettingDescriptor, sectionTitle: string): string {
  const { label, description = "", keywords = [] } = descriptor;
  return [sectionTitle, label, description, ...keywords, ...collectChoiceLabels(descriptor)].join("\n").toLowerCase();
}

function collectChoiceLabels(descriptor: SettingDescriptor): string[] {
  if (descriptor.kind === "choice" || descriptor.kind === "choices") {
    return descriptor.members.map(member => descriptor.labels[member]);
  }
  return [];
}
