import { EnableRule, Setting } from "@/lib/ui/settings/setting";
import { Preference } from "@/lib/storage/preference";
import { doNothing } from "@/utils/function";
import { toggleDataset } from "@/utils/dom/attribute";

export interface StateBinding<T> {
  preference: Preference<T> | null;
  defaultValue: T;
  apply: (value: T) => void;
}

export function toBinding<T>(setting: Partial<Setting<T>>, defaultValue: T): StateBinding<T> {
  return {
    preference: setting.preference ?? null,
    defaultValue,
    apply: setting.apply ?? doNothing
  };
}

export function currentValue<T>(binding: StateBinding<T>): T {
  return binding.preference === null ? binding.defaultValue : binding.preference.value;
}

export function onPreferenceChange<T>(binding: StateBinding<T>, apply: (value: T) => void): void {
  if (binding.preference !== null) {
    binding.preference.on(apply);
  }
}

export function bindEnableRule(settingElement: HTMLElement, rule: EnableRule | null | undefined): void {
  if (rule === null || rule === undefined) {
    return;
  }
  const update = (): void => {
    toggleDataset(settingElement, "disabled", !rule.isEnabled());
  };

  update();
  rule.subscribe(update);
}

export function commit<T>(binding: StateBinding<T>, value: T, save: boolean = true): void {
  if (save && binding.preference !== null) {
    binding.preference.set(value);
  }
  binding.apply(value);
}
