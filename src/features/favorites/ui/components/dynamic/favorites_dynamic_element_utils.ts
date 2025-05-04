import { MenuElement } from "../../../../../types/elements/menu_element";

export function prepareDynamicElements<T extends Partial<MenuElement>>(elements: T[]): T[] {
  return elements.reverse().filter(element => element.enabled !== false);
}
