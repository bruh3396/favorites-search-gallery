// What a setting binds to; a preference satisfies it structurally. `value` must be a signal read, so an effect
// that reads it reruns on change. Method syntax keeps a setting over a narrower member type assignable to the union.
export interface SettingPreference<T> {
  readonly value: T;
  set(value: T): void;
}

interface SettingBase {
  id: string;
  label: string;
  description?: string;
  // Extra words search matches, besides the label and description.
  keywords?: readonly string[];
  // Read in an effect, so it reruns whenever a signal it reads changes.
  enabledWhen?: () => boolean;
}

export interface SwitchSetting extends SettingBase {
  kind: "switch";
  preference: SettingPreference<boolean>;
}

// `members` is the preference's own `as const` list, so the options can't drift from its guard; it also sets the order.
export interface ChoiceSetting<M extends string = string> extends SettingBase {
  kind: "choice";
  preference: SettingPreference<M>;
  members: readonly M[];
  labels: Readonly<Record<M, string>>;
  variant: "segmented" | "dropdown";
}

export interface ChoicesSetting<M extends string = string> extends SettingBase {
  kind: "choices";
  preference: SettingPreference<readonly M[]>;
  members: readonly M[];
  labels: Readonly<Record<M, string>>;
}

// `min` and `max` come from the same const as the preference's range guard.
export interface NumberSetting extends SettingBase {
  kind: "number";
  preference: SettingPreference<number>;
  min: number;
  max: number;
  step: number;
}

export type SettingDescriptor = SwitchSetting | ChoiceSetting | ChoicesSetting | NumberSetting;
