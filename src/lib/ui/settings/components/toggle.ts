import { SettingsClass } from "@/lib/ui/settings/classes";
import { StateBinding } from "@/lib/ui/settings/state_binding";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { bindEnableRule } from "../enable_rule";
import { controlRow } from "@/lib/ui/settings/components/row";
import { createElement } from "@/utils/dom/element_factory";
import { toggleDataset } from "@/utils/dom/dataset";

export function buildToggleRow(config: Partial<ToggleSetting>): HTMLElement {
  const knob = createElement("span", { className: SettingsClass.toggleKnob });
  const track = createElement("span", { className: SettingsClass.toggleTrack, children: [knob] });
  const row = controlRow(config, track);

  if (config.id !== undefined) {
    row.id = `${config.id}-row`;
  }

  const binding = new StateBinding(config, false, (value) => {
    toggleDataset(row, "on", value);
  });

  row.addEventListener("click", () => {
    if (config.enabled === false) {
      return;
    }
    binding.set(!binding.value);
  });
  bindEnableRule(row, config.enabledWhen);

  if (config.hotkey !== undefined && config.hotkey !== "" && config.registerHotkey !== undefined) {
    config.registerHotkey(config.hotkey, () => {
      binding.set(!binding.value);
    });
  }
  return row;
}
