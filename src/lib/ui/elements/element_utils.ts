import { MenuElement } from "../element_types";

export function prepareDynamicElements<T>(elements: Partial<MenuElement<T>>[]): Partial<MenuElement<T>>[] {
  return elements.reverse().filter(element => element.enabled !== false);
}
