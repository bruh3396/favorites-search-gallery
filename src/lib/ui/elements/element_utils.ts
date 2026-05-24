import { MenuElement } from "../../../types/element";

export function prepareDynamicElements<T>(elements: Partial<MenuElement<T>>[]): Partial<MenuElement<T>>[] {
  return elements.reverse().filter(element => element.enabled !== false);
}
