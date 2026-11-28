import { Icon } from "@/core/ui/components/icon/icon";
import { Readable } from "@/core/utils/reactive/signal";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SettingPreference } from "@/core/ui/settings/setting_preference";

interface SettingBase {
  readonly label: string;
  readonly disabled?: Readable<boolean>;
}

interface SwitchSettingDescriptor extends SettingBase {
  readonly kind: "switch";
  readonly settingPreference: SettingPreference<boolean>;
}

interface ChoiceSettingDescriptor<M extends string = string> extends SettingBase {
  readonly kind: "choice";
  readonly settingPreference: SettingPreference<M>;
  readonly members: readonly M[];
  readonly labels: Readonly<Record<M, string>>;
  readonly icons?: Readonly<Record<M, Icon>>;
  readonly control: "segmented" | "dropdown";
  onPreview?(member: M | null): void;
}

interface ChoicesSettingDescriptor<M extends string = string> extends SettingBase {
  readonly kind: "choices";
  readonly settingPreference: SettingPreference<readonly M[]>;
  readonly members: readonly M[];
  readonly labels: Readonly<Record<M, string>>;
}

interface NumberSettingDescriptor extends SettingBase {
  readonly kind: "number";
  readonly settingPreference: SettingPreference<number>;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly writeOnEveryStep?: boolean;
  readonly scheduler: Pick<Scheduler, "schedule">;
}

interface SliderSettingDescriptor extends SettingBase {
  readonly kind: "slider";
  readonly settingPreference: SettingPreference<number>;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly inverted?: boolean;
}

export type SettingDescriptor =
  | SwitchSettingDescriptor
  | ChoiceSettingDescriptor
  | ChoicesSettingDescriptor
  | NumberSettingDescriptor
  | SliderSettingDescriptor;
