import { Content } from "../../../../lib/shell";
import { Preferences } from "../../../../lib/preferences/preferences";
import { insertStyle } from "../../../../lib/dom/injector";
import { sleep } from "../../../../lib/core/scheduling/promise";
import { toggleFavoritesOptions } from "../../view/update/menu_event_handlers";

const stickyMenuCSS = `
  #favorites-search-gallery-content {
    margin-top: 65px;
    margin-bottom: 65px;
  }
  #favorites-search-gallery-menu {
    position: fixed;
    margin-top: 0;
  }`;

async function onHeaderVisibilityChanged(headerVisible: boolean): Promise<void> {
  insertStyle(headerVisible ? "" : stickyMenuCSS, "fav-menu-sticky");
  const optionsMenu = document.getElementById("left-favorites-panel-bottom-row");

  Content.classList.remove("fav-menu--sticky");
  Content.classList.remove("fav-menu--sticky-shadow");

  if (optionsMenu === null || headerVisible) {
    return;
  }
  const menuIsOpen = !optionsMenu.classList.contains("u-hidden");

  if (menuIsOpen) {
    Content.classList.add("fav-menu--sticky");
  }
  // Let the DOM settle before adding the shadow so the transition plays correctly.
  await sleep(30);
  Content.classList.add("fav-menu--sticky-shadow");
}

export function setupMobileStickyMenu(optionsCheckbox: HTMLInputElement): void {
  toggleFavoritesOptions(Preferences.optionsVisible.value);
  optionsCheckbox.checked = Preferences.optionsVisible.value;

  let headerIsVisible = true;

  optionsCheckbox.addEventListener("change", () => {
    Preferences.optionsVisible.set(optionsCheckbox.checked);
    toggleFavoritesOptions(optionsCheckbox.checked);

    if (!headerIsVisible) {
      Content.classList.toggle("fav-menu--sticky", optionsCheckbox.checked);
    }
  });

  const header = document.getElementById("header");

  if (header === null) {
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    headerIsVisible = entries[0].isIntersecting;
    onHeaderVisibilityChanged(headerIsVisible);
  }, { threshold: 0 });

  observer.observe(header);
}
