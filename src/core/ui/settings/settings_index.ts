import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";

export interface SettingsIndexSection {
  readonly title: string;
  readonly descriptors: readonly SettingDescriptor[];
}

export class SettingsIndex {
  private readonly searchTexts: ReadonlyMap<string, string>;

  constructor(sections: readonly SettingsIndexSection[]) {
    this.searchTexts = new Map(sections.flatMap(({ title, descriptors }) => descriptors.map(descriptor => [descriptor.id, collectSearchText(descriptor, title)] as const)));
  }

  public match(query: string): ReadonlySet<string> {
    const terms = query.toLowerCase().split(/\s+/u).filter(term => term !== "");
    return new Set([...this.searchTexts].filter(([, text]) => terms.every(term => text.includes(term))).map(([id]) => id));
  }
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
