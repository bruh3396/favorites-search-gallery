import * as PostOverlayView from "@/features/post_overlay/view/post_overlay_view";

export function onPostOverlayToggled(enabled: boolean): void {
  if (!enabled) {
    PostOverlayView.hide();
  }
}
