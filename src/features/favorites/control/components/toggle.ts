import { bindEnableRule, bindHotkey, commit, currentValue, syncOnEvent, toBinding } from "@/features/favorites/control/components/state_binding";
import { SettingsClass } from "@/features/favorites/types/scaffold";
import { ToggleSetting } from "@/features/favorites/types/setting";
import { controlRow } from "@/features/favorites/control/components/row";

export function buildToggleRow(config: Partial<ToggleSetting>): HTMLElement {
  const binding = toBinding(config, false);
  let value = currentValue(binding);

  if (config.triggerOnCreation === true) {
    commit(binding, value, false);
  }

  const track = document.createElement("span");

  track.className = SettingsClass.toggleTrack;

  const knob = document.createElement("span");

  knob.className = SettingsClass.toggleKnob;
  track.appendChild(knob);

  const row = controlRow(config.label ?? "", config.tooltip ?? "", track, config.enabled !== false);

  if (config.id !== undefined) {
    row.id = `${config.id}-row`;
  }

  const render = (): void => {
    if (value) {
      row.dataset.on = "";
    } else {
      delete row.dataset.on;
    }
  };

  const apply = (next: boolean): void => {
    value = next;
    render();
    commit(binding, value);
  };

  render();

  row.addEventListener("click", () => {
    if (config.enabled === false) {
      return;
    }
    apply(!value);
  });

  syncOnEvent(binding, (next) => {
    value = next;
    render();
  });
  bindEnableRule(row, config.disableOn);
  bindHotkey(config.hotkey ?? "", () => {
    apply(!value);
  });

  return row;
}