import { isExitKey, isNavigationKey } from "@/types/guards";
import { EnhancedKeyboardEvent } from "@/lib/event/input";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { throttle } from "@/lib/async/rate_limiting";
import { toggleFullscreen } from "@/utils/browser/window";

export class GalleryKeyFlow extends GalleryFlow {
  private readonly insideGalleryHotkeyHandlers: Record<string, () => void> = {
    b: () => this.flows.background.toggleBackgroundOpacity(),
    e: () => this.flows.favoriter.addFavoriteInGallery(),
    f: toggleFullscreen,
    g: () => this.flows.openClose.close(),
    m: () => this.flows.video.toggleVideoMute(),
    q: () => this.model.openMedia(),
    s: () => this.model.download(),
    w: () => this.model.openPost(),
    // x: () => this.flows.favoriter.removeFavoriteInGallery(),
    " ": () => this.pauseVideo()
  };

  private readonly outsideGalleryHotkeyHandlers: Record<string, () => void> = {
    g: () => this.flows.openClose.reOpen(),
    f: toggleFullscreen
  };

  private readonly handleKeyDownThrottled = throttle((event: KeyboardEvent) => this.handleKeyDownNoThrottle(event), GalleryConfig.galleryNavigationDelay);

  public handleKeyDown(keyboardEvent: EnhancedKeyboardEvent): void {
    if (keyboardEvent.originalEvent.repeat) {
      this.handleKeyDownThrottled(keyboardEvent.originalEvent);
    } else {
      this.handleKeyDownNoThrottle(keyboardEvent.originalEvent);
    }
  }

  public handleKeyUp(event: EnhancedKeyboardEvent): void {
    this.flows.dispatch.run({ open: (keyboardEvent) => this.handleKeyUpInGallery(keyboardEvent) }, event);
  }

  private handleKeyDownNoThrottle(event: KeyboardEvent): void {
    this.flows.dispatch.run({
      idle: (keyboardEvent) => this.handleKeyDownOutsideGallery(keyboardEvent),
      preview: (keyboardEvent) => this.handleKeyDownOutsideGallery(keyboardEvent),
      open: (keyboardEvent) => this.handleKeyDownInGallery(keyboardEvent)
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
      this.flows.openClose.close();
      return;
    }

    if (event.shiftKey) {
      this.view.toggleZoomCursor(true);
      return;
    }

    if (keyboardEvent.isHotkey) {
      this.insideGalleryHotkeyHandlers[event.key.toLowerCase()]?.();
    }
  }

  private handleKeyDownOutsideGallery(event: EnhancedKeyboardEvent): void {
    if (event.isHotkey) {
      this.outsideGalleryHotkeyHandlers[event.key.toLowerCase()]?.();
    }
  }

  private handleKeyUpInGallery(event: EnhancedKeyboardEvent): void {
    if (event.key === "shift") {
      this.view.toggleZoomCursor(false);
    }
  }

  private pauseVideo(): void {
    if (this.model.isViewingVideo()) {
      this.view.toggleVideoPause();
    }
  }
}
