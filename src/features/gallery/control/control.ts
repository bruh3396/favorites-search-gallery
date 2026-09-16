import { AppContext } from "@/app/context/context";
import { GalleryEdgeTapControls } from "@/features/gallery/control/edge_tap_controls";
import { GalleryInteractionTracker } from "@/features/gallery/control/interaction_tracker";
import { GalleryThumbObserver } from "@/features/gallery/control/thumb_observer";
import { GalleryView } from "@/features/gallery/view/view";

export class GalleryControl {
  private readonly edgeTapControls: GalleryEdgeTapControls;
  private readonly interactionTracker: GalleryInteractionTracker;
  private readonly thumbObserver: GalleryThumbObserver;

  constructor(context: AppContext, view: GalleryView) {
    this.edgeTapControls = new GalleryEdgeTapControls(context, view);
    this.interactionTracker = new GalleryInteractionTracker(context);
    this.thumbObserver = new GalleryThumbObserver(context);
  }

  public setup(onVisibleThumbsChanged: () => void): void {
    this.edgeTapControls.setup();
    this.interactionTracker.setup();
    this.thumbObserver.setup(onVisibleThumbsChanged);
  }

  public refreshThumbObserver(): void {
    this.thumbObserver.refresh();
  }

  public setCenterThumb(thumb: HTMLElement | null): void {
    this.thumbObserver.setCenterThumb(thumb);
  }

  public getVisibleThumbs(): HTMLElement[] {
    return this.thumbObserver.getVisibleThumbs();
  }

  public enableInteractionTracking(): void {
    this.interactionTracker.enable();
  }

  public disableInteractionTracking(): void {
    this.interactionTracker.disable();
  }
}
