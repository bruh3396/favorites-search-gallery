import { EventEmitter } from "../../components/functional/event_emitter";
import { Preference } from "../../store/local_storage/preference";

export interface MenuElement {
  parentId: string
  id: string
  enabled: boolean
  title: string
  position: InsertPosition
  textContent: string
}

export interface HotkeyElement {
  hotkey: string
}

export interface FunctionalElement<T> {
  event: EventEmitter<T> | null
  function: (event: T) => void
  triggerOnCreation: boolean
}

export interface StateElement<T> extends FunctionalElement<T> {
  defaultValue: T
  preference: Preference<T> | null
  savePreference: boolean
}

export interface SelectElement<T extends (string | number)> extends MenuElement, HotkeyElement, StateElement<T> {
  options: Record<T, string>
  isNumeric: boolean
}

export interface NumberElement extends MenuElement, StateElement<number> {
  min: number
  max: number
  step: number
  pollingTime: number
}

export interface ButtonElement extends MenuElement, FunctionalElement<MouseEvent>, HotkeyElement {
  rightClickEnabled: boolean
}

export interface CheckboxElement extends MenuElement, StateElement<boolean>, HotkeyElement {}

export const DEFAULT_MENU_ELEMENT: MenuElement = {
  parentId: "",
  id: "",
  enabled: true,
  title: "bruh",
  position: "afterbegin",
  textContent: ""
};
