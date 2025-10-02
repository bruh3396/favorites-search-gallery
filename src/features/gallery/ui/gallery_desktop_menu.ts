import * as Icons from "../../../assets/icons";
import { GalleryMenuAction, GalleryMenuButton } from "../types/gallery_types";
import { insertStyleHTML, setColorScheme } from "../../../utils/dom/style";
import { toggleFullscreen, toggleGalleryMenuEnabled } from "../../../utils/dom/dom";
import { Events } from "../../../lib/global/events/events";
import { GALLERY_CONTAINER } from "./gallery_container";
import { GallerySettings } from "../../../config/gallery_settings";
import { GeneralSettings } from "../../../config/general_settings";
import { ON_MOBILE_DEVICE } from "../../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../../lib/global/preferences/preferences";
import { Timeout } from "../../../types/common_types";
import { throttle } from "../../../utils/misc/async";

const BUTTONS: GalleryMenuButton[] = [
  { id: "exit-gallery", icon: Icons.EXIT, action: "exit", enabled: true, hint: "Exit (Escape, Right-Click)", color: "red" },
  { id: "fullscreen-gallery", icon: Icons.FULLSCREEN_ENTER, action: "fullscreen", enabled: true, hint: "Toggle Fullscreen (F)", color: "#0075FF" },
  { id: "open-in-new-gallery", icon: Icons.OPEN_IN_NEW, action: "openPost", enabled: true, hint: "Open Post (Middle-Click, G)", color: "lightgreen" },
  { id: "open-image-gallery", icon: Icons.IMAGE, action: "openOriginal", enabled: true, hint: "Open Original (Ctrl + Left-Click, Q)", color: "magenta" },
  { id: "download-gallery", icon: Icons.DOWNLOAD, action: "download", enabled: true, hint: "Download (S)", color: "lightskyblue" },
  { id: "add-favorite-gallery", icon: Icons.HEART_PLUS, action: "addFavorite", enabled: true, hint: "Add Favorite (E)", color: "hotpink" },
  { id: "remove-favorite-gallery", icon: Icons.HEART_MINUS, action: "removeFavorite", enabled: false, hint: "Remove Favorite (X)", color: "red" },
  { id: "dock-gallery", icon: Icons.DOCK, action: "toggleDockPosition", enabled: false, hint: "Change Position", color: "" },
  { id: "toggle-background-gallery", icon: Icons.BULB, action: "toggleBackground", enabled: true, hint: "Toggle Background (B)", color: "gold" },
  { id: "search-gallery", icon: Icons.SEARCH, action: "search", enabled: false, hint: "Search", color: "cyan" },
  { id: "background-color-gallery", icon: Icons.PALETTE, action: "changeBackgroundColor", enabled: true, hint: "Background Color", color: "orange" },
  { id: "pin-gallery", icon: Icons.PIN, action: "pin", enabled: true, hint: "Pin Menu", color: "#0075FF" }
];

const MENU: HTMLElement = document.createElement("div");
const throttledReveal = throttle<MouseEvent>(() => {
  reveal();
}, 250);
let menuVisibilityTimeout: Timeout;

MENU.id = "gallery-menu";
MENU.className = "gallery-sub-menu";

function loadPreferences(): void {
  if (Preferences.dockGalleryMenuLeft.value) {
    toggleDockPosition();
  }

  if (Preferences.galleryMenuPinned.value) {
    togglePin();
  }
  toggleGalleryMenuEnabled(Preferences.galleryMenuEnabled.value);
}

function addEventListeners(): void {
  Events.document.mousemove.on(throttledReveal);

  Events.document.mouseover.on((mouseOverEvent) => {
    togglePersistence(mouseOverEvent.originalEvent);
  });
}

function handleGalleryMenuAction(action: GalleryMenuAction): void {
  switch (action) {
    case "fullscreen":
      toggleFullscreen();
      break;

    case "pin":
      togglePin();
      break;

    case "toggleDockPosition":
      toggleDockPosition();
      break;

    default:
      break;
  }
}

function createButtons(): void {
  const buttonContainer = document.createElement("div");

  buttonContainer.id = "gallery-menu-button-container";

  for (const template of BUTTONS) {
    if (template.enabled) {
      buttonContainer.appendChild(createButton(template));
    }
  }
  MENU.appendChild(buttonContainer);
}

function createButton(template: GalleryMenuButton): HTMLElement {
  const button = document.createElement("span");

  button.innerHTML = template.icon;
  button.id = template.id;
  button.className = "gallery-menu-button";
  button.dataset.hint = template.hint;
  button.onclick = (): void => {
    handleGalleryMenuAction(template.action);
    Events.gallery.galleryMenuButtonClicked.emit(template.action);
  };

  if (GallerySettings.galleryMenuMonoColor) {
    template.color = "#0075FF";
  }

  if (template.color !== "") {
    insertStyleHTML(`
        #${template.id}:hover {
          &::after {
            outline: 2px solid ${template.color};
          }

          color: ${template.color};

          >svg {
            fill: ${template.color};
          }
        }
      `, template.id);
  }
  return button;
}

function createColorPicker(): void {
  const button = document.getElementById("background-color-gallery");

  if (!(button instanceof HTMLElement)) {
    return;
  }
  const colorPicker = document.createElement("input");

  colorPicker.type = "color";
  colorPicker.id = "gallery-menu-background-color-picker";
  button.onclick = (): void => {
    colorPicker.click();
  };
  colorPicker.oninput = (): void => {
    setColorScheme(colorPicker.value);
  };

  if (Preferences.colorScheme.defaultValue !== Preferences.colorScheme.value) {
    setColorScheme(Preferences.colorScheme.value);
  }
  button.insertAdjacentElement("afterbegin", colorPicker);
}

function reveal(): void {
  MENU.classList.add("active");
  clearTimeout(menuVisibilityTimeout);
  menuVisibilityTimeout = setTimeout(() => {
    hide();
  }, GallerySettings.menuVisibilityTime);
}

function hide(): void {
  MENU.classList.remove("active");
}

function togglePersistence(event: MouseEvent): void {
  MENU.classList.toggle("persistent", event.target instanceof HTMLElement && MENU.contains(event.target));
}

function togglePin(): void {
  if (ON_MOBILE_DEVICE) {
    MENU.classList.add("pinned");
    Preferences.galleryMenuPinned.set(true);
    return;
  }
  Preferences.galleryMenuPinned.set(MENU.classList.toggle("pinned"));
}

function toggleDockPosition(): void {
  if (ON_MOBILE_DEVICE) {
    MENU.classList.remove("dock-left");
    Preferences.dockGalleryMenuLeft.set(false);
    return;
  }
  Preferences.dockGalleryMenuLeft.set(MENU.classList.toggle("dock-left"));
}

export function setupDesktopGalleryMenu(): void {
  if (!GeneralSettings.galleryMenuOptionEnabled) {
    return;
  }
  GALLERY_CONTAINER.appendChild(MENU);
  loadPreferences();
  createButtons();
  createColorPicker();
  addEventListeners();
}
