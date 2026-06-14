import { Emitter } from "@/lib/communication/emitter";
import { Preference } from "@/lib/storage/preference";

export interface EnableRule {
  subscribe: (recompute: () => void) => void;
  isEnabled: () => boolean;
}

export function enableWhen<E>(event: Emitter<E>, initial: () => E, predicate: (value: E) => boolean): EnableRule {
  let latest = initial();
  return {
    subscribe: (recompute) => event.on((value) => {
      latest = value;
      recompute();
    }),
    isEnabled: () => predicate(latest)
  };
}

export interface Setting<T> {
  id: string;
  label: string;
  tooltip: string;
  enabled: boolean;
  preference: Preference<T> | null;
  defaultValue: T;
  event: Emitter<T> | null;
  function: (value: T) => void;
  triggerOnCreation: boolean;
  disableOn: EnableRule | null;
}

export interface ToggleSetting extends Setting<boolean> {
  hotkey: string;
}

export interface SelectSetting<T extends string | number> extends Setting<T> {
  options: Map<T, string>;
}

export interface StepperSetting extends Setting<number> {
  min: number;
  max: number;
  step: number;
}
