import * as PostOverlayTagsResolver from "@/features/post_overlay/model/tags/resolver";
import { CursorTracker } from "@/features/post_overlay/model/state/cursor_tracker";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { OverlayTarget } from "@/features/post_overlay/model/state/overlay_target";
import { ReopenCooldown } from "@/features/post_overlay/model/state/reopen_cooldown";
import { ResizeState } from "@/features/post_overlay/model/state/resize_state";
import { TagCategoryMap } from "@/types/search";

export class PostOverlayModel {
  private readonly overlayTarget = new OverlayTarget();
  private readonly cursorTracker = new CursorTracker();
  private readonly reopenCooldown = new ReopenCooldown();
  private readonly resizeState = new ResizeState();

  public resolveTagCategories(thumb: HTMLElement): Promise<TagCategoryMap> {
    return PostOverlayTagsResolver.resolveAll(thumb);
  }

  public isCurrentTarget(thumbId: string): boolean {
    return this.overlayTarget.isCurrent(thumbId);
  }

  public setCurrentTarget(thumbId: string): void {
    this.overlayTarget.setCurrent(thumbId);
  }

  public clearOverlayTarget(): void {
    this.overlayTarget.clear();
  }

  public recordCursorPosition(event: EnhancedMouseEvent): void {
    this.cursorTracker.record(event);
  }

  public thumbUnderCursor(): HTMLElement | null {
    return this.cursorTracker.thumbUnderCursor();
  }

  public isCoolingDown(): boolean {
    return this.reopenCooldown.isCoolingDown();
  }

  public startReopenCooldown(onElapsed: () => void): void {
    this.reopenCooldown.start(onElapsed);
  }

  public isResizing(): boolean {
    return this.resizeState.isResizing();
  }

  public setResizing(active: boolean): void {
    this.resizeState.setResizing(active);
  }
}
