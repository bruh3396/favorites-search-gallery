import { GalleryFlow, GalleryFlowDependencies } from "@/features/gallery/flows/flow";
import { isExitKey, isNavigationKey } from "@/lib/event/keys";
import { EnhancedKeyboardEvent } from "@/lib/event/input";
import { GalleryAction } from "@/types/app";
import { GalleryConfig } from "@/config/gallery_config";
import { throttle } from "@/lib/async/rate_limiting";
import { toggleFullscreen } from "@/utils/browser/window";

const HOTKEY_ACTIONS: Record<string, GalleryAction> = {
  b: "toggleBackground",
  e: "addFavorite",
  f: "fullscreen",
  g: "exit",
  m: "toggleMute",
  q: "openOriginal",
  s: "download",
  w: "openPost",
  " ": "togglePause"
};

export class GalleryKeyboardFlow extends GalleryFlow {
  private readonly outsideGalleryHotkeys: Record<string, () => void>;
  private readonly handleKeyDownThrottled: (event: KeyboardEvent) => void;

  constructor(dependencies: GalleryFlowDependencies) {
    super(dependencies);
    this.outsideGalleryHotkeys = {
      g: (): void => this.flows.navigation.reOpen(),
      f: toggleFullscreen
    };
    this.handleKeyDownThrottled = throttle((event: KeyboardEvent) => this.handleKeyDownNow(event), GalleryConfig.galleryNavigationDelay);
  }

  public handleKeyDown(keyboardEvent: EnhancedKeyboardEvent): void {
    if (keyboardEvent.originalEvent.repeat) {
      this.handleKeyDownThrottled(keyboardEvent.originalEvent);
    } else {
      this.handleKeyDownNow(keyboardEvent.originalEvent);
    }
  }

  public handleKeyUp(event: EnhancedKeyboardEvent): void {
    this.runForState({ open: keyboardEvent => this.handleKeyUpInGallery(keyboardEvent) }, event);
  }

  private handleKeyDownNow(event: KeyboardEvent): void {
    this.runForState({
      idle: keyboardEvent => this.handleKeyDownOutsideGallery(keyboardEvent),
      preview: keyboardEvent => this.handleKeyDownOutsideGallery(keyboardEvent),
      open: keyboardEvent => this.handleKeyDownInGallery(keyboardEvent)
    }, new EnhancedKeyboardEvent(event));
  }

  private handleKeyDownInGallery(keyboardEvent: EnhancedKeyboardEvent): void {
    const event = keyboardEvent.originalEvent;

    if (event.ctrlKey) {
      return;
    }

    if (isNavigationKey(event.key)) {
      event.stopImmediatePropagation();
      this.flows.navigation.navigate(event.key);
      return;
    }

    if (isExitKey(event.key)) {
      this.flows.navigation.close();
      return;
    }

    if (event.shiftKey) {
      this.view.toggleZoomCursor(true);
      return;
    }
    const action = HOTKEY_ACTIONS[event.key.toLowerCase()];

    if (keyboardEvent.isHotkey && action !== undefined) {
      this.flows.actions.run(action);
    }
  }

  private handleKeyDownOutsideGallery(event: EnhancedKeyboardEvent): void {
    if (event.isHotkey) {
      this.outsideGalleryHotkeys[event.key.toLowerCase()]?.();
    }
  }

  private handleKeyUpInGallery(event: EnhancedKeyboardEvent): void {
    if (event.key === "shift") {
      this.view.toggleZoomCursor(false);
    }
  }
}
