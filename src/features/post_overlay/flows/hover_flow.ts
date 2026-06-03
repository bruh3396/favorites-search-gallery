import * as PostOverlayModeDispatch from "./mode_dispatch";
import * as PostOverlayModel from "../model/post_overlay_model";
import * as PostOverlayView from "../view/post_overlay_view";
import { EnhancedMouseEvent } from "../../../types/input";
import { Preferences } from "../../../app/context/preferences";
import { getTagSetFromItem } from "../../../lib/thumb/thumb_tags";

let currentThumbId: string | null = null;

export function onMouseover(event: EnhancedMouseEvent): void {
  if (!Preferences.postOverlayEnabled.value) {
    return;
  }

  if (!event.insideOfThumb || event.thumb === null) {
    currentThumbId = null;
    PostOverlayView.hide();
    return;
  }
  const thumb = event.thumb;

  if (thumb.id === currentThumbId) {
    return;
  }
  currentThumbId = thumb.id;
  PostOverlayModeDispatch.dispatchByMode<HTMLElement>({
    tags: renderTagOverlay
  }, thumb);
}

async function renderTagOverlay(thumb: HTMLElement): Promise<void> {
  const tagNames = getTagSetFromItem(thumb);

  tagNames.delete(thumb.id);
  const categories = await PostOverlayModel.resolveTagCategories(Array.from(tagNames));

  if (thumb.id !== currentThumbId) {
    return;
  }
  PostOverlayView.renderTags(thumb.id, categories);
  PostOverlayView.showForThumb(thumb);
}
