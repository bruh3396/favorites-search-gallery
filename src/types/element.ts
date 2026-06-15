import { Emitter } from "@/lib/communication/emitter";
import { IconName } from "@/lib/ui/icon";
import { Preference } from "@/lib/storage/preference";
import { doNothing } from "@/utils/function";

export interface MenuElement<T> {
  parentId: string
  id: string
  enabled: boolean
  title: string
  position: InsertPosition
  textContent: string
  function: (event: T) => void
  triggerOnCreation: boolean
}

export interface HotkeyElement {
  hotkey: string
}

export interface StateMenuElement<T> extends MenuElement<T> {
  defaultValue: T
  preference: Preference<T> | null
  savePreference: boolean
}

export interface ButtonElement extends MenuElement<MouseEvent>, HotkeyElement {
  event: Emitter<MouseEvent> | null
  rightClickEnabled: boolean
  icon: IconName | null
}

export interface CheckboxElement extends StateMenuElement<boolean>, HotkeyElement {}

export interface SelectElement<T extends (string | number)> extends StateMenuElement<T> {
  options: Map<T, string>
  isNumeric: boolean
}

export const defaultMenuElement: MenuElement<void> = {
  parentId: "",
  id: "",
  enabled: true,
  title: "",
  position: "afterbegin",
  textContent: "",
  function: doNothing,
  triggerOnCreation: false
};
