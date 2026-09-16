import * as PostOverlayTagRenderer from "@/features/post_overlay/view/rendering/tag_renderer";
import { PostOverlayElement } from "@/features/post_overlay/view/shell/element";
import { Shell } from "@/app/context/shell";
import { TagCategoryMap } from "@/types/search";

export class PostOverlayView {
  private readonly element: PostOverlayElement;

  constructor(shell: Shell) {
    this.element = new PostOverlayElement(shell);
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

  public isVisible(): boolean {
    return this.element.isVisible();
  }
}
