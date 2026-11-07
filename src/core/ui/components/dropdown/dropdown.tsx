import { Signal, computed } from "@/core/utils/reactive/signal";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlProps } from "@/core/ui/components/control/control_props";
import { OptionMenu } from "@/core/ui/components/option_menu/option_menu";
import { OptionMenuItem } from "@/core/ui/components/option_menu/option_menu_item";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export const DropdownClass = {
  root: "fsg-Dropdown",
  label: "fsg-Dropdown-label",
  chevron: "fsg-Dropdown-chevron"
} as const;

export interface DropdownProps<Value> extends ControlProps<Value> {
  controlChoices: readonly ControlChoice<Value>[];
  onPreview?: (previewedValue: Value | null) => void;
}

export function Dropdown<Value>({
  controlChoices, value, disabled = new Signal(false), onValueChange, onPreview, size: controlSize = "medium"
}: DropdownProps<Value>): HTMLElement {
  const selectedIndex = computed(() => controlChoices.findIndex(controlChoice => controlChoice.value === value.value));
  const optionMenuItems = controlChoices.map(({ label, value: choiceValue }, index): OptionMenuItem => ({
    label,
    selected: computed(() => selectedIndex.value === index),
    onChoose: (): void => {
      if (index !== selectedIndex.peek()) {
        onValueChange(choiceValue);
      }
    }
  }));
  const trigger = (
    <button className={DropdownClass.root} type="button" role="combobox" dataset={{ size: controlSize }} disabled={disabled}>
      <span className={DropdownClass.label}>{computed(() => controlChoices[selectedIndex.value]?.label ?? "")}</span>
      {createIcon("chevronDown", DropdownClass.chevron)}
    </button>
  );
  return (
    <OptionMenu
      trigger={trigger}
      items={optionMenuItems}
      controlSize={controlSize}
      onActiveChange={activeIndex => onPreview?.(activeIndex === undefined ? null : controlChoices[activeIndex].value)}
    />
  );
}
