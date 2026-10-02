import { EnableRule } from "@/lib/ui/settings/enable_rule";
import { Preference } from "@/lib/storage/preference";
import { TooltipPosition } from "@/lib/ui/tooltip/tooltip";

export interface Setting<T> {
  id: string;
  label: string;
  tooltip: string;
  tooltipPosition: TooltipPosition;
  enabled: boolean;
  preference: Preference<T> | null;
  enabledWhen: EnableRule | null;
}

export interface ToggleSetting extends Omit<Setting<boolean>, "preference" | "enabledWhen"> {
  preference: Preference<boolean>;
  enabledWhen: () => boolean;
  hotkey: string;
}

export interface SelectSetting<T extends string | number> extends Setting<T> {
  options: Map<T, string>;
}

export interface MultiSelectSetting<T extends number> extends SelectSetting<T> {
  requireSelection: boolean;
}

export interface StepperSetting extends Setting<number> {
  min: number;
  max: number;
  step: number;
}

export interface SliderSetting extends Setting<number> {
  min: number;
  max: number;
  step: number;
}
