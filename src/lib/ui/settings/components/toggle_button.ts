import { StateBinding } from "@/lib/ui/settings/state_binding";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/platform/factory";
import { icon } from "@/lib/ui/icon";
import { toggleDataset } from "@/utils/platform/dataset";

export function buildToggleButton(config: Partial<ToggleSetting>, iconName: Parameters<typeof icon>[0]): HTMLButtonElement {
  const button = createElement("button", {
    id: config.id,
    className: "menu-icon-btn",
    children: [icon(iconName)]
  });

  button.type = "button";
  addTooltip(button, config.tooltip ?? "", "below");

  const binding = new StateBinding(config, false, (value) => {
    toggleDataset(button, "active", value);
  });

  button.onclick = (): void => {
    binding.set(!binding.value);
  };

  if (config.hotkey !== undefined && config.hotkey !== "" && config.registerHotkey !== undefined) {
    config.registerHotkey(config.hotkey, () => {
      binding.set(!binding.value);
    });
  }
  return button;
}
