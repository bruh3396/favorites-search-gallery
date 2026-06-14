import { EnableRule, Setting } from "@/features/favorites/types/setting";
import { DomEvents } from "@/app/dom/events";
import { Emitter } from "@/lib/communication/emitter";
import { Preference } from "@/lib/storage/preference";
import { galleryOpened } from "@/app/channels/feature_bridge";
import { toggleDataset } from "@/utils/dom/attribute";

export interface StateBinding<T> {
  preference: Preference<T> | null;
  defaultValue: T;
  event: Emitter<T> | null;
  function: (value: T) => void;
}

export function toBinding<T>(setting: Partial<Setting<T>>, fallbackDefault: T): StateBinding<T> {
  return {
    preference: setting.preference ?? null,
    defaultValue: setting.defaultValue ?? fallbackDefault,
    event: setting.event ?? null,
    function: setting.function ?? ((): void => undefined)
  };
}

export function currentValue<T>(binding: StateBinding<T>): T {
  return binding.preference === null ? binding.defaultValue : binding.preference.value;
}

export function syncOnEvent<T>(binding: StateBinding<T>, apply: (value: T) => void): void {
  if (binding.event !== null) {
    binding.event.on(apply);
  }
}

export function bindEnableRule(row: HTMLElement, rule: EnableRule | null | undefined): void {
  if (rule === null || rule === undefined) {
    return;
  }
  const update = (): void => {
    toggleDataset(row, "disabled", !rule.isEnabled());
  };

  update();
  rule.subscribe(update);
}

export function commit<T>(binding: StateBinding<T>, value: T, save: boolean = true): void {
  if (save && binding.preference !== null) {
    binding.preference.set(value);
  }

  if (binding.event !== null) {
    binding.event.emit(value);
  }
  binding.function(value);
}

export function bindHotkey(hotkey: string, toggle: () => void): void {
  if (hotkey === "") {
    return;
  }
  DomEvents.document.keydown.on((event) => {
    if (!event.isHotkey || event.key.toLowerCase() !== hotkey.toLowerCase()) {
      return;
    }

    if (galleryOpened()) {
      return;
    }
    toggle();
  });
}
