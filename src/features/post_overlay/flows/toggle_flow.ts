import * as PostOverlayView from "../view/post_overlay_view";

export function onPostOverlayToggled(enabled: boolean): void {
  if (!enabled) {
    PostOverlayView.hide();
  }
}
