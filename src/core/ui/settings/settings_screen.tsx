import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { Setting } from "@/core/ui/settings/setting";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingSection } from "@/core/ui/settings/setting_section";
import { SettingsIndex } from "@/core/ui/settings/settings_index";
import { SettingsLayout } from "@/core/ui/settings/settings_layout";
import { StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { h } from "@/core/ui/h/h";

export const SettingsScreenClass = {
  root: "fsg-SettingsScreen",
  section: "fsg-SettingsScreen-section",
  heading: "fsg-SettingsScreen-heading",
  group: "fsg-SettingsScreen-group"
} as const;

export interface SettingsScreenProps {
  layout: SettingsLayout;
  descriptors: readonly SettingDescriptor[];
  descriptionsVisible?: Readable<boolean>;
  query?: Readable<string>;
  size?: ControlSize;
  scheduler: StepperScheduler;
}

interface SectionProps {
  section: SettingSection;
  descriptors: readonly SettingDescriptor[];
  matches: Readable<ReadonlySet<string>>;
  descriptionsVisible: Readable<boolean> | undefined;
  size: ControlSize;
  scheduler: StepperScheduler;
}

export function SettingsScreen({ layout, descriptors, descriptionsVisible, query, size = "medium", scheduler }: SettingsScreenProps): HTMLElement {
  const descriptorsById = new Map(descriptors.map(descriptor => [descriptor.id, descriptor]));
  const sectionsWithSettings = layout
    .map(section => ({ section, title: section.title, descriptors: section.settings.map(id => getDescriptor(descriptorsById, id)) }))
    .filter(entry => entry.descriptors.length > 0);
  const index = new SettingsIndex(sectionsWithSettings);
  const matches = computed(() => index.match(query?.value ?? ""));
  return (
    <div className={SettingsScreenClass.root} dataset={{ size }}>
      {sectionsWithSettings.map(entry => (
        <Section
          section={entry.section}
          descriptors={entry.descriptors}
          matches={matches}
          descriptionsVisible={descriptionsVisible}
          size={size}
          scheduler={scheduler}
        />
      ))}
    </div>
  );
}

function Section({ section, descriptors, matches, descriptionsVisible, size, scheduler }: SectionProps): HTMLElement {
  const settings = descriptors.map(descriptor => (
    <Setting descriptor={descriptor} descriptionVisible={descriptionsVisible} size={size} scheduler={scheduler} />
  ));
  const heading = <h3 className={SettingsScreenClass.heading}>{section.title}</h3>;
  const element = (
    <section className={SettingsScreenClass.section}>
      {heading}
      <div className={SettingsScreenClass.group}>{settings}</div>
    </section>
  );
  const showMatches = (shown: ReadonlySet<string>): void => {
    settings.forEach((setting, position) => {
      setting.hidden = !shown.has(descriptors[position].id);
    });
    element.hidden = !descriptors.some(descriptor => shown.has(descriptor.id));
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
