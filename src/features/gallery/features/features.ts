import { AppContext } from "@/app/context/context";
import { Autoplay } from "@/features/gallery/features/autoplay/autoplay";
import { AutoplayCallbacks } from "@/features/gallery/features/autoplay/types/types";

export interface GalleryFeaturesDependencies {
  autoplay: AutoplayCallbacks;
}

export class GalleryFeatures {
  private readonly context: AppContext;
  private readonly autoplay: Autoplay;

  constructor(context: AppContext, { autoplay }: GalleryFeaturesDependencies) {
    const { preferences, environment } = context;

    this.context = context;
    this.autoplay = new Autoplay({
      ...autoplay,
      active: preferences.gallery.autoplayActive,
      paused: preferences.gallery.autoplayPaused,
      forward: preferences.gallery.autoplayForward,
      durations: {
        image: preferences.gallery.autoplayImageDuration,
        minimumVideo: preferences.gallery.autoplayMinimumVideoDuration
      },
      platform: environment.device
    });
  }

  public setup(): void {
    this.setupAutoplay();
  }

  public handleVideoEnded(): void {
    this.autoplay.handleVideoEnded();
  }

  public showMenu(): void {
    this.autoplay.showMenu();
  }

  private setupAutoplay(): void {
    const { events, preferences, domEvents, shell } = this.context;

    this.autoplay.mount(shell.overlays);
    preferences.gallery.autoplayActive.on(() => this.autoplay.refresh());
    events.gallery.galleryOpened.on(() => this.autoplay.openGallery());
    events.gallery.galleryClosed.on(() => this.autoplay.closeGallery());
    events.gallery.itemDisplayed.on((item) => this.autoplay.display(item));
    domEvents.document.mousemove.on(() => this.autoplay.handleMouseMove());
    domEvents.document.keydown.on((event) => this.autoplay.handleKeyDown(event));
  }
}
