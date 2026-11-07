import { Readable, computed } from "@/core/utils/reactive/signal";
import { ChipMenu } from "@/core/ui/components/chip_menu/chip_menu";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { OptionMenuItem } from "@/core/ui/components/option_menu/option_menu_item";
import { h } from "@/core/ui/h/h";

export interface MaskChipProps {
  label: string;
  controlChoices: readonly ControlChoice<number>[];
  value: Readable<number>;
  onValueChange: (value: number) => void;
}

export function MaskChip({ label, controlChoices, value, onValueChange }: MaskChipProps): HTMLElement {
  const selectedControlChoices = computed(() => controlChoices.filter(controlChoice => (value.value & controlChoice.value) !== 0));
  const isNarrowed = computed(() => selectedControlChoices.value.length < controlChoices.length);
  const optionMenuItems = controlChoices.map((controlChoice): OptionMenuItem => ({
    label: controlChoice.label,
    selected: computed(() => selectedControlChoices.value.includes(controlChoice)),
    disabled: computed(() => value.value === controlChoice.value),
    keepsOpen: true,
    onChoose: (): void => onValueChange(value.peek() ^ controlChoice.value)
  }));
  return (
    <ChipMenu
      label={label}
      value={computed(() => (isNarrowed.value ? selectedControlChoices.value.map(controlChoice => controlChoice.label).join(", ") : "All"))}
      highlighted={isNarrowed}
      optionMenuItems={optionMenuItems}
    />
  );
}
