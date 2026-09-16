import * as Icons from "@/assets/svg/icons";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Environment } from "@/app/context/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryMenuAction } from "@/types/app";
import { GalleryMenuButton } from "@/features/gallery/types/types";
import { GeneralConfig } from "@/config/general_config";
import { Preferences } from "@/app/context/preferences";
import { Timeout } from "@/types/async";
import { insertStyle } from "@/utils/browser/injector";
import { toggleFullscreen } from "@/utils/browser/window";
import { toggleGalleryMenuEnabled } from "@/lib/ui/toggles";

export class GalleryMenu {
  private readonly environment: Environment;
  private readonly preferences: Preferences;
  private readonly buttons: GalleryMenuButton[];
  private readonly menu: HTMLElement;
  private menuVisibilityTimeout: Timeout | undefined;
  private menuActionCallback: (action: GalleryMenuAction) => void;
  private readonly menuVisibilityTime: number;

  constructor(preferences: Preferences, environment: Environment) {
    this.preferences = preferences;
    this.environment = environment;
    this.menuVisibilityTime = environment.onMobileDevice ? GalleryConfig.menuVisibilityTime.mobile : GalleryConfig.menuVisibilityTime.desktop;
    this.menuActionCallback = (): void => { };
    this.buttons = [
      { id: "exit-gallery", icon: Icons.EXIT, action: "exit", enabled: true, tooltip: "Exit (Escape, Right-Click, G)", color: "red" },
      { id: "fullscreen-gallery", icon: Icons.FULLSCREEN_ENTER, action: "fullscreen", enabled: environment.onDesktopDevice, tooltip: "Toggle Fullscreen (F)", color: "#0075FF" },
      { id: "open-in-new-gallery", icon: Icons.OPEN_IN_NEW, action: "openPost", enabled: true, tooltip: "Open Post (Middle-Click, W)", color: "lightgreen" },
      { id: "open-image-gallery", icon: Icons.IMAGE, action: "openOriginal", enabled: true, tooltip: "Open Original (Ctrl + Left-Click, Q)", color: "magenta" },
      { id: "download-gallery", icon: Icons.DOWNLOAD, action: "download", enabled: true, tooltip: "Download (S)", color: "lightskyblue" },
      { id: "add-favorite-gallery", icon: Icons.HEART_PLUS, action: "addFavorite", enabled: true, tooltip: "Add Favorite (E)", color: "hotpink" },
      { id: "remove-favorite-gallery", icon: Icons.HEART_MINUS, action: "removeFavorite", enabled: false, tooltip: "Remove Favorite (X)", color: "red" },
      { id: "dock-gallery", icon: Icons.DOCK, action: "toggleDockPosition", enabled: false, tooltip: "Change Position", color: "" },
      { id: "toggle-background-gallery", icon: Icons.BULB, action: "toggleBackground", enabled: environment.onDesktopDevice, tooltip: "Toggle Background (B)", color: "gold" },
      { id: "search-gallery", icon: Icons.SEARCH, action: "search", enabled: false, tooltip: "Search", color: "cyan" },
      { id: "pin-gallery", icon: Icons.PIN, action: "pin", enabled: environment.onDesktopDevice, tooltip: "Pin Menu", color: "#0075FF" }
    ];
    this.menu = document.createElement("div");
    this.menu.id = "gallery-menu";
    this.menu.className = "gallery-sub-menu";
  }

  public setup(root: HTMLElement, onMenuAction: (action: GalleryMenuAction) => void): void {
    if (!GeneralConfig.galleryMenuOptionEnabled || this.environment.onMobileDevice) {
      return;
    }
    this.menuActionCallback = onMenuAction;
    root.appendChild(this.menu);
    this.loadPreferences();
    this.createButtons();
  }

  public togglePersistence(event: EnhancedMouseEvent): void {
    const target = event.originalEvent.target;

    this.menu.classList.toggle("gallery-menu--persistent", target instanceof HTMLElement && this.menu.contains(target));
  }

  public setPinned(pinned: boolean): void {
    this.menu.classList.toggle("gallery-menu--pinned", pinned);
  }

  public setDockedLeft(dockedLeft: boolean): void {
    this.menu.classList.toggle("gallery-menu--docked", dockedLeft);
  }

  public reveal(): void {
    this.menu.classList.add("gallery-menu--visible");
    clearTimeout(this.menuVisibilityTimeout);
    this.menuVisibilityTimeout = setTimeout(() => {
      this.hide();
    }, this.menuVisibilityTime);
  }

  private loadPreferences(): void {
    this.setDockedLeft(this.preferences.gallery.menuDockedLeft.value);
    this.setPinned(this.preferences.gallery.menuPinned.value);
    toggleGalleryMenuEnabled(this.preferences.gallery.menuEnabled.value);
  }

  private handleGalleryMenuAction(action: GalleryMenuAction): void {
    switch (action) {
      case "fullscreen":
        toggleFullscreen();
        break;

      default:
        break;
    }
  }

  private createButtons(): void {
    const buttonContainer = document.createElement("div");

    buttonContainer.id = "gallery-menu-button-container";

    for (const template of this.buttons) {
      if (template.enabled) {
        buttonContainer.appendChild(this.createButton(template));
      }
    }
    this.menu.appendChild(buttonContainer);
  }

  private createButton(template: GalleryMenuButton): HTMLElement {
    const button = document.createElement("span");

    button.innerHTML = template.icon;
    button.id = template.id;
    button.className = "gallery-menu-btn";
    button.dataset.hint = template.tooltip;
    button.onclick = (): void => {
      this.handleGalleryMenuAction(template.action);
      this.menuActionCallback(template.action);
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

  private hide(): void {
    this.menu.classList.remove("gallery-menu--visible");
  }
}
