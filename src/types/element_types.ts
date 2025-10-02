import { DO_NOTHING } from "../utils/misc/async";
import { EventEmitter } from "../lib/components/event_emitter";
import { Preference } from "../lib/global/preferences/preference";

export interface MenuElement<T> {
  parentId: string
  id: string
  enabled: boolean
  title: string
  position: InsertPosition
  textContent: string
  event: EventEmitter<T> | null
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
  rightClickEnabled: boolean
}

export interface CheckboxElement extends StateMenuElement<boolean>, HotkeyElement {}

export interface SelectElement<T extends (string | number)> extends StateMenuElement<T> {
  options: Map<T, string>
  isNumeric: boolean
}

export interface NumberElement extends StateMenuElement<number> {
  min: number
  max: number
  step: number
  pollingTime: number
}

export const DEFAULT_MENU_ELEMENT: MenuElement<void> = {
  parentId: "",
  id: "",
  enabled: true,
  title: "bruh",
  position: "afterbegin",
  textContent: "",
  event: null,
  function: DO_NOTHING,
  triggerOnCreation: false
};
