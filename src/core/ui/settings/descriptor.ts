import { Readable } from "@/core/utils/reactive/signal";

export interface SettingPreference<T> extends Readable<T> {
  set(value: T): void;
}

interface SettingBase {
  id: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  disabled?: Readable<boolean>;
}

export interface SwitchSetting extends SettingBase {
  kind: "switch";
  preference: SettingPreference<boolean>;
}

export interface ChoiceSetting<M extends string = string> extends SettingBase {
  kind: "choice";
  preference: SettingPreference<M>;
  members: readonly M[];
  labels: Readonly<Record<M, string>>;
  control: "segmented" | "dropdown";
}

export interface ChoicesSetting<M extends string = string> extends SettingBase {
  kind: "choices";
  preference: SettingPreference<readonly M[]>;
  members: readonly M[];
  labels: Readonly<Record<M, string>>;
}

export interface NumberSetting extends SettingBase {
  kind: "number";
  preference: SettingPreference<number>;
  min: number;
  max: number;
  step: number;
  writeOnEveryStep?: boolean;
}

export type SettingDescriptor = SwitchSetting | ChoiceSetting | ChoicesSetting | NumberSetting;
