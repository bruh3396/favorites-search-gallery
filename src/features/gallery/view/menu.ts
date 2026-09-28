import { removeDataset, setDataset, toggleDataset } from "@/utils/browser/dataset";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Environment } from "@/core/boundary/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { Preferences } from "@/app/context/preferences";
import { Timeout } from "@/types/async";
import { toggleGalleryMenuEnabled } from "@/lib/ui/toggles";

export class GalleryMenu {
  private readonly menu: HTMLElement;
  private readonly menuVisibilityTime: number;
  private menuVisibilityTimeout: Timeout | undefined;

  constructor(preferences: Preferences, environment: Environment, menu: HTMLElement) {
    this.menu = menu;
    this.menuVisibilityTime = environment.device === "mobile" ? GalleryConfig.menuVisibilityTime.mobile : GalleryConfig.menuVisibilityTime.desktop;
    this.menuVisibilityTimeout = undefined;
    this.setDockedLeft(preferences.gallery.menuDockedLeft.value);
    this.setPinned(preferences.gallery.menuPinned.value);
    this.setEnabled(preferences.gallery.menuEnabled.value);
  }

  public setEnabled(enabled: boolean): void {
    toggleGalleryMenuEnabled(enabled);
  }

  public togglePersistence(event: EnhancedMouseEvent): void {
    const target = event.originalEvent.target;

    toggleDataset(this.menu, "persistent", target instanceof HTMLElement && this.menu.contains(target));
  }

  public setPinned(pinned: boolean): void {
    toggleDataset(this.menu, "pinned", pinned);
  }

  public setDockedLeft(dockedLeft: boolean): void {
    toggleDataset(this.menu, "docked", dockedLeft);
  }

  public reveal(): void {
    setDataset(this.menu, "visible");
    clearTimeout(this.menuVisibilityTimeout);
    this.menuVisibilityTimeout = setTimeout(() => {
      this.hide();
    }, this.menuVisibilityTime);
  }

  private hide(): void {
    removeDataset(this.menu, "visible");
  }
}
