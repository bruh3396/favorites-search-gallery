import { Icon } from "@/core/ui/components/icon/icon";
import { Readable } from "@/core/utils/reactive/signal";
import { SettingPreference } from "@/core/ui/settings/setting_preference";

interface SettingBase {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly disabled?: Readable<boolean>;
}

export interface SwitchSettingDescriptor extends SettingBase {
  readonly kind: "switch";
  readonly settingPreference: SettingPreference<boolean>;
}

export interface ChoiceSettingDescriptor<M extends string = string> extends SettingBase {
  readonly kind: "choice";
  readonly settingPreference: SettingPreference<M>;
  readonly members: readonly M[];
  readonly labels: Readonly<Record<M, string>>;
  readonly icons?: Readonly<Record<M, Icon>>;
  readonly control: "segmented" | "dropdown";
  onPreview?(member: M | null): void;
}

export interface ChoicesSettingDescriptor<M extends string = string> extends SettingBase {
  readonly kind: "choices";
  readonly settingPreference: SettingPreference<readonly M[]>;
  readonly members: readonly M[];
  readonly labels: Readonly<Record<M, string>>;
}

export interface NumberSettingDescriptor extends SettingBase {
  readonly kind: "number";
  readonly settingPreference: SettingPreference<number>;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly writeOnEveryStep?: boolean;
}

export interface SliderSettingDescriptor extends SettingBase {
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
