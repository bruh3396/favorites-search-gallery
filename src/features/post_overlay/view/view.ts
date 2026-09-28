import * as PostOverlayTagRenderer from "@/features/post_overlay/view/rendering/tag_renderer";
import { PostOverlayClass } from "@/features/post_overlay/types/selectors";
import { PostOverlayPool } from "@/features/post_overlay/view/overlay";
import { PostOverlayShell } from "@/features/post_overlay/shell/shell";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { isInside } from "@/utils/browser/guards";

export class PostOverlayView {
  private readonly element: PostOverlayPool;

  constructor(shell: PostOverlayShell) {
    this.element = new PostOverlayPool(shell.overlays);
  }

  public renderTags(postId: string, categoryMap: TagCategoryMap): void {
    PostOverlayTagRenderer.renderTags(this.element.getOverlay(), postId, categoryMap);
  }

  public reveal(thumb: HTMLElement): void {
    this.element.reveal(thumb);
  }

  public hide(): void {
    this.element.hide();
  }

  public isInsideOverlay(target: EventTarget | null): boolean {
    return isInside(target, `.${PostOverlayClass.overlay}`);
  }

  public isVisible(): boolean {
    return this.element.isVisible();
  }
}
