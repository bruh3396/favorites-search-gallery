import { Readable } from "@/core/utils/reactive/signal";

export interface SettingPreference<T> extends Readable<T> {
  set(value: T): void;
}

interface SettingBase {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly disabled?: Readable<boolean>;
}

export interface SwitchSetting extends SettingBase {
  readonly kind: "switch";
  readonly preference: SettingPreference<boolean>;
}

export interface ChoiceSetting<M extends string = string> extends SettingBase {
  readonly kind: "choice";
  readonly preference: SettingPreference<M>;
  readonly members: readonly M[];
  readonly labels: Readonly<Record<M, string>>;
  readonly control: "segmented" | "dropdown";
}

export interface ChoicesSetting<M extends string = string> extends SettingBase {
  readonly kind: "choices";
  readonly preference: SettingPreference<readonly M[]>;
  readonly members: readonly M[];
  readonly labels: Readonly<Record<M, string>>;
}

export interface NumberSetting extends SettingBase {
  readonly kind: "number";
  readonly preference: SettingPreference<number>;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly writeOnEveryStep?: boolean;
}

export type SettingDescriptor = SwitchSetting | ChoiceSetting | ChoicesSetting | NumberSetting;
