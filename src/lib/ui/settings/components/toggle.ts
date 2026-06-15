import { bindEnableRule, commit, currentValue, onPreferenceChange, toBinding } from "@/lib/ui/settings/state_binding";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/dom/element_factory";
import { toggleDataset } from "@/utils/dom/attribute";

export function buildToggleRow(config: Partial<ToggleSetting>): HTMLElement {
  const binding = toBinding(config, false);
  let value = currentValue(binding);

  if (config.applyOnBuild === true) {
    commit(binding, value, false);
  }
  const knob = createElement("span", { className: SettingsClass.toggleKnob });
  const track = createElement("span", { className: SettingsClass.toggleTrack, children: [knob] });
  const row = controlRow(config, track);

  if (config.id !== undefined) {
    row.id = `${config.id}-row`;
  }

  const render = (): void => {
    toggleDataset(row, "on", value);
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

  onPreferenceChange(binding, (next) => {
    value = next;
    render();
  });
  bindEnableRule(row, config.enabledWhen);

  if (config.hotkey !== undefined && config.hotkey !== "" && config.registerHotkey !== undefined) {
    config.registerHotkey(config.hotkey, () => {
      apply(!value);
    });
  }
  return row;
}
