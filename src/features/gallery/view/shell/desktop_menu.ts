import * as Icons from "../../../../assets/icons";
import { setColorScheme, toggleGalleryMenuEnabled } from "../../../../lib/ui/style";
import { GalleryConfig } from "../../../../config/gallery_config";
import { GalleryMenuAction } from "../../../../types/ui";
import { GalleryMenuButton } from "../../types/gallery_types";
import { GalleryRoot } from "./shell";
import { GeneralConfig } from "../../../../config/general_config";
import { ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { Preferences } from "../../../../lib/preferences/preferences";
import { EnhancedMouseEvent } from "../../../../lib/dom/input_types";
import { Timeout } from "../../../../types/async";
import { insertStyle } from "../../../../lib/dom/injector";
import { toggleFullscreen } from "../../../../utils/browser/window";

const buttons: GalleryMenuButton[] = [
  { id: "exit-gallery", icon: Icons.EXIT, action: "exit", enabled: true, tooltip: "Exit (Escape, Right-Click)", color: "red" },
  { id: "fullscreen-gallery", icon: Icons.FULLSCREEN_ENTER, action: "fullscreen", enabled: true, tooltip: "Toggle Fullscreen (F)", color: "#0075FF" },
  { id: "open-in-new-gallery", icon: Icons.OPEN_IN_NEW, action: "openPost", enabled: true, tooltip: "Open Post (Middle-Click, G)", color: "lightgreen" },
  { id: "open-image-gallery", icon: Icons.IMAGE, action: "openOriginal", enabled: true, tooltip: "Open Original (Ctrl + Left-Click, Q)", color: "magenta" },
  { id: "download-gallery", icon: Icons.DOWNLOAD, action: "download", enabled: true, tooltip: "Download (S)", color: "lightskyblue" },
  { id: "add-favorite-gallery", icon: Icons.HEART_PLUS, action: "addFavorite", enabled: true, tooltip: "Add Favorite (E)", color: "hotpink" },
  { id: "remove-favorite-gallery", icon: Icons.HEART_MINUS, action: "removeFavorite", enabled: false, tooltip: "Remove Favorite (X)", color: "red" },
  { id: "dock-gallery", icon: Icons.DOCK, action: "toggleDockPosition", enabled: false, tooltip: "Change Position", color: "" },
  { id: "toggle-background-gallery", icon: Icons.BULB, action: "toggleBackground", enabled: true, tooltip: "Toggle Background (B)", color: "gold" },
  { id: "search-gallery", icon: Icons.SEARCH, action: "search", enabled: false, tooltip: "Search", color: "cyan" },
  { id: "background-color-gallery", icon: Icons.PALETTE, action: "changeBackgroundColor", enabled: true, tooltip: "Background Color", color: "orange" },
  { id: "pin-gallery", icon: Icons.PIN, action: "pin", enabled: true, tooltip: "Pin Menu", color: "#0075FF" }
];

const menu: HTMLElement = document.createElement("div");
let menuVisibilityTimeout: Timeout;
let menuActionCallback: (action: GalleryMenuAction) => void = () => { };

menu.id = "gallery-menu";
menu.className = "gallery-sub-menu";

export function setup(onMenuAction: (action: GalleryMenuAction) => void): void {
  if (!GeneralConfig.galleryMenuOptionEnabled) {
    return;
  }
  menuActionCallback = onMenuAction;
  GalleryRoot.appendChild(menu);
  loadPreferences();
  createButtons();
  createColorPicker();
}

export function onMouseMove(): void {
  reveal();
}

export function onMouseOver(event: EnhancedMouseEvent): void {
  togglePersistence(event.originalEvent);
}

function loadPreferences(): void {
  if (Preferences.galleryMenuDockedLeft.value) {
    toggleDockPosition();
  }

  if (Preferences.galleryMenuPinned.value) {
    togglePin();
  }
  toggleGalleryMenuEnabled(Preferences.galleryMenuEnabled.value);
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

  for (const template of buttons) {
    if (template.enabled) {
      buttonContainer.appendChild(createButton(template));
    }
  }
  menu.appendChild(buttonContainer);
}

function createButton(template: GalleryMenuButton): HTMLElement {
  const button = document.createElement("span");

  button.innerHTML = template.icon;
  button.id = template.id;
  button.className = "gallery-menu-btn";
  button.dataset.hint = template.tooltip;
  button.onclick = (): void => {
    handleGalleryMenuAction(template.action);
    menuActionCallback(template.action);
  };

  if (GalleryConfig.galleryMenuMonoColor) {
    template.color = "#0075FF";
  }

  if (template.color !== "") {
    insertStyle(`
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
  button.insertAdjacentElement("afterbegin", colorPicker);
}

function reveal(): void {
  menu.classList.add("gallery-menu--visible");
  clearTimeout(menuVisibilityTimeout);
  menuVisibilityTimeout = setTimeout(() => {
    hide();
  }, GalleryConfig.menuVisibilityTime);
}

function hide(): void {
  menu.classList.remove("gallery-menu--visible");
}

function togglePersistence(event: MouseEvent): void {
  menu.classList.toggle("gallery-menu--persistent", event.target instanceof HTMLElement && menu.contains(event.target));
}

function togglePin(): void {
  if (ON_MOBILE_DEVICE) {
    menu.classList.add("gallery-menu--pinned");
    Preferences.galleryMenuPinned.set(true);
    return;
  }
  Preferences.galleryMenuPinned.set(menu.classList.toggle("gallery-menu--pinned"));
}

function toggleDockPosition(): void {
  if (ON_MOBILE_DEVICE) {
    menu.classList.remove("gallery-menu--docked");
    Preferences.galleryMenuDockedLeft.set(false);
    return;
  }
  Preferences.galleryMenuDockedLeft.set(menu.classList.toggle("gallery-menu--docked"));
}
