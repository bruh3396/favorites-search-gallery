import { ControlSize } from "@/core/ui/components/control/control_size";
import { Setting } from "@/core/ui/settings/setting";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingSection } from "@/core/ui/settings/setting_section";
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
  controlSize?: ControlSize;
}

interface SectionProps {
  settingSection: SettingSection;
  settingDescriptors: readonly SettingDescriptor[];
  renderSetting: (settingDescriptor: SettingDescriptor) => HTMLElement;
}

export function SettingsScreen({ settingsLayout, settingDescriptors, controlSize = "medium" }: SettingsScreenProps): HTMLElement {
  const descriptorsById = new Map(settingDescriptors.map(settingDescriptor => [settingDescriptor.id, settingDescriptor]));
  return (
    <div className={SettingsScreenClass.root} dataset={{ size: controlSize }}>
      {settingsLayout
        .filter(settingSection => settingSection.settings.length > 0)
        .map(settingSection => (
          <Section
            settingSection={settingSection}
            settingDescriptors={settingSection.settings.map(id => getDescriptor(descriptorsById, id))}
            renderSetting={settingDescriptor => (
              <Setting descriptor={settingDescriptor} controlSize={controlSize} />
            )}
          />
        ))}
    </div>
  );
}

function Section({ settingSection, settingDescriptors, renderSetting }: SectionProps): HTMLElement {
  const heading = <h3 className={SettingsScreenClass.heading}>{settingSection.title}</h3>;
  const element = (
    <section className={SettingsScreenClass.section}>
      {heading}
      <div className={SettingsScreenClass.group}>{settingDescriptors.map(renderSetting)}</div>
    </section>
  );

  element.ariaLabelledByElements = [heading];
  return element;
}

function getDescriptor(descriptorsById: ReadonlyMap<string, SettingDescriptor>, id: string): SettingDescriptor {
  const descriptor = descriptorsById.get(id);

  if (descriptor === undefined) {
    throw new Error(`The layout names a setting with no descriptor: "${id}"`);
  }
  return descriptor;
}
