import { Reactive, h } from "@/core/ui/h/h";
import { Chip } from "@/core/ui/components/chip/chip";
import { OptionMenu } from "@/core/ui/components/option_menu/option_menu";
import { OptionMenuItem } from "@/core/ui/components/option_menu/option_menu_item";
import { Readable } from "@/core/utils/reactive/signal";
import { createIcon } from "@/core/ui/components/icon/icon";

export const ChipMenuClass = {
  chevron: "fsg-ChipMenu-chevron"
} as const;

export interface ChipMenuProps {
  label: string;
  value: Reactive<string>;
  highlighted: Readable<boolean>;
  optionMenuItems: readonly OptionMenuItem[];
}

export function ChipMenu({ label, value, highlighted, optionMenuItems }: ChipMenuProps): HTMLElement {
  const trigger = <Chip label={label} value={value} highlighted={highlighted}>{createIcon("chevronDown", ChipMenuClass.chevron)}</Chip>;
  return <OptionMenu trigger={trigger} items={optionMenuItems} controlSize="small" />;
}
