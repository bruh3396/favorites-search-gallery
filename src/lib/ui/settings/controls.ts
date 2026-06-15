import { SelectSetting, StepperSetting, ToggleSetting } from "@/lib/ui/settings/setting";
import { buildDropdownRow } from "@/lib/ui/settings/components/dropdown";
import { buildMultiSegmentedRow } from "@/lib/ui/settings/components/multi_segmented";
import { buildSegmentedRow } from "@/lib/ui/settings/components/segmented";
import { buildStepperRow } from "@/lib/ui/settings/components/stepper";
import { buildToggleRow } from "@/lib/ui/settings/components/toggle";

export type SettingsControl = () => HTMLElement;
export const toggle = (config: Partial<ToggleSetting>): SettingsControl => (): HTMLElement => buildToggleRow(config);
export const segmented = <T extends string>(config: Partial<SelectSetting<T>>): SettingsControl => (): HTMLElement => buildSegmentedRow(config);
export const multiSegmented = <T extends number>(config: Partial<SelectSetting<T>>): SettingsControl => (): HTMLElement => buildMultiSegmentedRow(config);
export const dropdown = <T extends string>(config: Partial<SelectSetting<T>>): SettingsControl => (): HTMLElement => buildDropdownRow(config);
export const stepper = (config: Partial<StepperSetting>): SettingsControl => (): HTMLElement => buildStepperRow(config);
