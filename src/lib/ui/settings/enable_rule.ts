import { Preference } from "@/lib/storage/preference";
import { toggleDataset } from "@/utils/platform/dataset";

export interface EnableRule {
  subscribe: (recompute: () => void) => void;
  isEnabled: () => boolean;
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

export function enableWhen<E>(preference: Preference<E>, predicate: (value: E) => boolean): EnableRule {
  return {
    subscribe: (recompute) => preference.on(recompute),
    isEnabled: () => predicate(preference.value)
  };
}
