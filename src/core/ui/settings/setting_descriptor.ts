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

export interface SwitchSetting extends SettingBase {
  readonly kind: "switch";
  readonly preference: SettingPreference<boolean>;
}

export interface ChoiceSetting<M extends string = string> extends SettingBase {
  readonly kind: "choice";
  readonly preference: SettingPreference<M>;
  readonly members: readonly M[];
  readonly labels: Readonly<Record<M, string>>;
  readonly icons?: Readonly<Record<M, Icon>>;
  readonly control: "segmented" | "dropdown";
  onPreview?(member: M | null): void;
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

export interface SliderSetting extends SettingBase {
  readonly kind: "slider";
  readonly preference: SettingPreference<number>;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly inverted?: boolean;
}

export type SettingDescriptor = SwitchSetting | ChoiceSetting | ChoicesSetting | NumberSetting | SliderSetting;
