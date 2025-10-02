import { MenuElement } from "../../../../../types/element_types";

export function prepareDynamicElements<T>(elements: Partial<MenuElement<T>>[]): Partial<MenuElement<T>>[] {
  return elements.reverse().filter(e => e.enabled !== false);
}
