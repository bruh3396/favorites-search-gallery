import * as Icons from "@/assets/icons";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { EnhancedMouseEvent } from "@/lib/input";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryMenuAction } from "@/types/app";
import { GalleryMenuButton } from "@/features/gallery/types/gallery_types";
import { GalleryRoot } from "@/features/gallery/view/shell/shell";
import { GeneralConfig } from "@/config/general_config";
import { Preferences } from "@/app/context/preferences";
import { Timeout } from "@/types/async";
import { insertStyle } from "@/utils/browser/injector";
import { toggleFullscreen } from "@/utils/browser/window";
import { toggleGalleryMenuEnabled } from "@/lib/ui/toggles";

const buttons: GalleryMenuButton[] = [
  { id: "exit-gallery", icon: Icons.EXIT, action: "exit", enabled: true, tooltip: "Exit (Escape, Right-Click, G)", color: "red" },
  { id: "fullscreen-gallery", icon: Icons.FULLSCREEN_ENTER, action: "fullscreen", enabled: ON_DESKTOP_DEVICE, tooltip: "Toggle Fullscreen (F)", color: "#0075FF" },
  { id: "open-in-new-gallery", icon: Icons.OPEN_IN_NEW, action: "openPost", enabled: true, tooltip: "Open Post (Middle-Click, W)", color: "lightgreen" },
  { id: "open-image-gallery", icon: Icons.IMAGE, action: "openOriginal", enabled: true, tooltip: "Open Original (Ctrl + Left-Click, Q)", color: "magenta" },
  { id: "download-gallery", icon: Icons.DOWNLOAD, action: "download", enabled: true, tooltip: "Download (S)", color: "lightskyblue" },
  { id: "add-favorite-gallery", icon: Icons.HEART_PLUS, action: "addFavorite", enabled: true, tooltip: "Add Favorite (E)", color: "hotpink" },
  { id: "remove-favorite-gallery", icon: Icons.HEART_MINUS, action: "removeFavorite", enabled: false, tooltip: "Remove Favorite (X)", color: "red" },
  { id: "dock-gallery", icon: Icons.DOCK, action: "toggleDockPosition", enabled: false, tooltip: "Change Position", color: "" },
  { id: "toggle-background-gallery", icon: Icons.BULB, action: "toggleBackground", enabled: ON_DESKTOP_DEVICE, tooltip: "Toggle Background (B)", color: "gold" },
  { id: "search-gallery", icon: Icons.SEARCH, action: "search", enabled: false, tooltip: "Search", color: "cyan" },
  { id: "pin-gallery", icon: Icons.PIN, action: "pin", enabled: ON_DESKTOP_DEVICE, tooltip: "Pin Menu", color: "#0075FF" }
];

const menu: HTMLElement = document.createElement("div");
let menuVisibilityTimeout: Timeout;
let menuActionCallback: (action: GalleryMenuAction) => void = () => { };

menu.id = "gallery-menu";
menu.className = "gallery-sub-menu";

export function setup(onMenuAction: (action: GalleryMenuAction) => void): void {
  if (!GeneralConfig.galleryMenuOptionEnabled || ON_MOBILE_DEVICE) {
    return;
  }
  menuActionCallback = onMenuAction;
  GalleryRoot.appendChild(menu);
  loadPreferences();
  createButtons();
}

export function togglePersistence(event: EnhancedMouseEvent): void {
  const target = event.originalEvent.target;

  menu.classList.toggle("gallery-menu--persistent", target instanceof HTMLElement && menu.contains(target));
}

export function setPinned(pinned: boolean): void {
  menu.classList.toggle("gallery-menu--pinned", pinned);
}

export function setDockedLeft(dockedLeft: boolean): void {
  menu.classList.toggle("gallery-menu--docked", dockedLeft);
}

export function reveal(): void {
  menu.classList.add("gallery-menu--visible");
  clearTimeout(menuVisibilityTimeout);
  menuVisibilityTimeout = setTimeout(() => {
    hide();
  }, GalleryConfig.menuVisibilityTime);
}

function loadPreferences(): void {
  setDockedLeft(Preferences.gallery.menuDockedLeft.value);
  setPinned(Preferences.gallery.menuPinned.value);
  toggleGalleryMenuEnabled(Preferences.gallery.menuEnabled.value);
}

function handleGalleryMenuAction(action: GalleryMenuAction): void {
  switch (action) {
    case "fullscreen":
      toggleFullscreen();
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
    template.color = "var(--theme-accent)";
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

function hide(): void {
  menu.classList.remove("gallery-menu--visible");
}
