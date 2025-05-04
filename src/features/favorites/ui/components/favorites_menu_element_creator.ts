import { createDynamicFavoritesDesktopMenuElements as createDynamicFavoritesMenuElements } from "./dynamic/favorites_desktop_dynamic_elements";
import { createStaticFavoritesMenuElements } from "./static/favorites_menu_static_element_creator";

export function createFavoritesMenuElements(): void {
  createDynamicFavoritesMenuElements();
  createStaticFavoritesMenuElements();
}
