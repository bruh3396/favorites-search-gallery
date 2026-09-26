import * as Icons from "@/assets/svg/icons";
import { AppContext } from "@/app/context/context";
import { Environment } from "@/app/context/environment";
import { GalleryClass } from "@/features/gallery/types/selectors";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryMenuAction } from "@/types/app";
import { GalleryMenuButton } from "@/features/gallery/types/types";
import { GalleryShell } from "@/features/gallery/shell/shell";
import { GeneralConfig } from "@/config/general_config";
import { createElement } from "@/utils/browser/element";

export function setup(context: AppContext, shell: GalleryShell): void {
  const { environment, events } = context;

  if (!GeneralConfig.galleryMenuOptionEnabled || environment.onMobileDevice) {
    return;
  }
  shell.menuButtons.append(...buttonsFor(environment).filter(button => button.enabled).map(createButton));
  shell.menuButtons.addEventListener("click", (event) => {
    const action = actionOf(event.target);

    if (action !== null) {
      events.gallery.galleryMenuButtonClicked.emit(action);
    }
  });
}

function buttonsFor(environment: Environment): GalleryMenuButton[] {
  return [
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
}

function createButton(template: GalleryMenuButton): HTMLElement {
  const color = GalleryConfig.galleryMenuMonoColor ? "var(--theme-accent)" : template.color;
  const hoverColor: Record<string, string> = color === "" ? {} : { hoverColor: "" };
  const button = createElement("span", {
    id: template.id,
    className: GalleryClass.menuButton,
    dataset: { hint: template.tooltip, action: template.action, ...hoverColor }
  });

  button.innerHTML = template.icon;
  button.style.setProperty("--gallery-menu-btn-color", color);
  return button;
}

function actionOf(target: EventTarget | null): GalleryMenuAction | null {
  const button = target instanceof Element ? target.closest<HTMLElement>("[data-action]") : null;
  return (button?.dataset.action as GalleryMenuAction | undefined) ?? null;
}
