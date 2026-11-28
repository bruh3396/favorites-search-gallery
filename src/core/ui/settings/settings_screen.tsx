import { ControlSize } from "@/core/ui/components/control/control_size";
import { Setting } from "@/core/ui/settings/setting";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { h } from "@/core/ui/h/h";

export const SettingsScreenClass = {
  root: "fsg-SettingsScreen",
  section: "fsg-SettingsScreen-section",
  heading: "fsg-SettingsScreen-heading",
  group: "fsg-SettingsScreen-group"
} as const;

export interface SettingsScreenProps<SettingId extends string> {
  settingsLayout: readonly { readonly title: string; readonly settingIds: readonly SettingId[] }[];
  settingDescriptors: Readonly<Record<SettingId, SettingDescriptor>>;
  controlSize?: ControlSize;
}

interface SectionProps {
  title: string;
  settingDescriptors: readonly SettingDescriptor[];
  renderSetting: (settingDescriptor: SettingDescriptor) => HTMLElement;
}

export function SettingsScreen<SettingId extends string>({
  settingsLayout, settingDescriptors, controlSize = "medium"
}: SettingsScreenProps<SettingId>): HTMLElement {
  return (
    <div className={SettingsScreenClass.root} dataset={{ size: controlSize }}>
      {settingsLayout
        .filter(({ settingIds }) => settingIds.length > 0)
        .map(({ title, settingIds }) => (
          <Section
            title={title}
            settingDescriptors={settingIds.map(settingId => settingDescriptors[settingId])}
            renderSetting={settingDescriptor => (
              <Setting descriptor={settingDescriptor} controlSize={controlSize} />
            )}
          />
        ))}
    </div>
  );
}

function Section({ title, settingDescriptors, renderSetting }: SectionProps): HTMLElement {
  const heading = <h3 className={SettingsScreenClass.heading}>{title}</h3>;
  const element = (
    <section className={SettingsScreenClass.section}>
      {heading}
      <div className={SettingsScreenClass.group}>{settingDescriptors.map(renderSetting)}</div>
    </section>
  );

  element.ariaLabelledByElements = [heading];
  return element;
}
