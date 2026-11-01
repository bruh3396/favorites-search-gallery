import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { Setting } from "@/core/ui/settings/setting";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingSection } from "@/core/ui/settings/setting_section";
import { SettingsIndex } from "@/core/ui/settings/settings_index";
import { SettingsLayout } from "@/core/ui/settings/settings_layout";
import { h } from "@/core/ui/h/h";

export const SettingsScreenClass = {
  root: "fsg-SettingsScreen",
  section: "fsg-SettingsScreen-section",
  heading: "fsg-SettingsScreen-heading",
  group: "fsg-SettingsScreen-group"
} as const;

export interface SettingsScreenProps {
  settingsLayout: SettingsLayout;
  settingDescriptors: readonly SettingDescriptor[];
  query?: Readable<string>;
  controlSize?: ControlSize;
}

interface SectionProps {
  settingSection: SettingSection;
  settingDescriptors: readonly SettingDescriptor[];
  matches: Readable<ReadonlySet<string>>;
  renderSetting: (settingDescriptor: SettingDescriptor) => HTMLElement;
}

export function SettingsScreen({
  settingsLayout, settingDescriptors, query, controlSize = "medium"
}: SettingsScreenProps): HTMLElement {
  const descriptorsById = new Map(settingDescriptors.map(settingDescriptor => [settingDescriptor.id, settingDescriptor]));
  const sectionsWithSettings = settingsLayout
    .map(settingSection => ({
      section: settingSection,
      title: settingSection.title,
      settingDescriptors: settingSection.settings.map(id => getDescriptor(descriptorsById, id))
    }))
    .filter(entry => entry.settingDescriptors.length > 0);
  const settingsIndex = new SettingsIndex(sectionsWithSettings);
  const matches = computed(() => settingsIndex.match(query?.value ?? ""));
  return (
    <div className={SettingsScreenClass.root} dataset={{ size: controlSize }}>
      {sectionsWithSettings.map(entry => (
        <Section
          settingSection={entry.section}
          settingDescriptors={entry.settingDescriptors}
          matches={matches}
          renderSetting={settingDescriptor => (
            <Setting descriptor={settingDescriptor} controlSize={controlSize} />
          )}
        />
      ))}
    </div>
  );
}

function Section({ settingSection, settingDescriptors, matches, renderSetting }: SectionProps): HTMLElement {
  const settings = settingDescriptors.map(renderSetting);
  const heading = <h3 className={SettingsScreenClass.heading}>{settingSection.title}</h3>;
  const element = (
    <section className={SettingsScreenClass.section}>
      {heading}
      <div className={SettingsScreenClass.group}>{settings}</div>
    </section>
  );
  const showMatches = (shown: ReadonlySet<string>): void => {
    settings.forEach((setting, position) => {
      setting.hidden = !shown.has(settingDescriptors[position].id);
    });
    element.hidden = !settingDescriptors.some(settingDescriptor => shown.has(settingDescriptor.id));
  };

  element.ariaLabelledByElements = [heading];
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
