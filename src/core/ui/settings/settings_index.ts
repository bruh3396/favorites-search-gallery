import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";

export interface SettingsIndexSection {
  readonly title: string;
  readonly settingDescriptors: readonly SettingDescriptor[];
}

export class SettingsIndex {
  private readonly searchTexts: ReadonlyMap<string, string>;

  constructor(sections: readonly SettingsIndexSection[]) {
    this.searchTexts = new Map(sections.flatMap(({ title, settingDescriptors }) => {
      return settingDescriptors.map(settingDescriptor => [settingDescriptor.id, collectSearchText(settingDescriptor, title)] as const);
    }));
  }

  public match(query: string): ReadonlySet<string> {
    const terms = query.toLowerCase().split(/\s+/u).filter(term => term !== "");
    return new Set([...this.searchTexts].filter(([, text]) => terms.every(term => text.includes(term))).map(([id]) => id));
  }
}

function collectSearchText(settingDescriptor: SettingDescriptor, sectionTitle: string): string {
  const { label, description = "", keywords = [] } = settingDescriptor;
  return [sectionTitle, label, description, ...keywords, ...collectChoiceLabels(settingDescriptor)].join("\n").toLowerCase();
}

function collectChoiceLabels(settingDescriptor: SettingDescriptor): string[] {
  if (settingDescriptor.kind === "choice" || settingDescriptor.kind === "choices") {
    return settingDescriptor.members.map(member => settingDescriptor.labels[member]);
  }
  return [];
}
