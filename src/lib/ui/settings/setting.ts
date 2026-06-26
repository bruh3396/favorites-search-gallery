import { EnableRule } from "@/lib/ui/settings/enable_rule";
import { Preference } from "@/lib/storage/preference";

export interface Setting<T> {
  id: string;
  label: string;
  tooltip: string;
  enabled: boolean;
  preference: Preference<T> | null;
  apply: (value: T) => void;
  applyOnBuild: boolean;
  enabledWhen: EnableRule | null;
}

export interface ToggleSetting extends Setting<boolean> {
  hotkey: string;
  registerHotkey: (key: string, fire: () => void) => void;
}

export interface SelectSetting<T extends string | number> extends Setting<T> {
  options: Map<T, string>;
}

export interface StepperSetting extends Setting<number> {
  min: number;
  max: number;
  step: number;
}
