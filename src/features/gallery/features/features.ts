import { AppContext } from "@/app/context/context";
import { EnhancedKeyboardEvent } from "@/lib/event/input";
import { GalleryAutoplay } from "@/features/gallery/features/autoplay/autoplay";
import { NavigationKey } from "@/types/input";

type Subscribe<E> = (callback: (event: E) => void, options?: AddEventListenerOptions) => void;

interface GalleryFeaturesDependencies {
  autoplay: {
    setVideoLooping: (value: boolean) => void;
    onComplete: (direction?: NavigationKey) => void;
    onVideoEndedBeforeMinimumViewTime: () => void;
    subscribeToMouseMove: Subscribe<MouseEvent>;
    subscribeToKeyDown: Subscribe<EnhancedKeyboardEvent>;
  };
}

export class GalleryFeatures {
  private readonly autoplay: GalleryAutoplay;

  constructor(private readonly context: AppContext) {
    this.autoplay = new GalleryAutoplay(context);
  }

  public setup(dependencies: GalleryFeaturesDependencies): void {
    this.setupAutoplay(dependencies.autoplay);
  }

  public handleVideoEnded(): void {
    this.autoplay.handleVideoEnded();
  }

  public showMenu(): void {
    this.autoplay.showMenu();
  }

  private setupAutoplay(dependencies: GalleryFeaturesDependencies["autoplay"]): void {
    const { events, preferences } = this.context;

    this.autoplay.setup(dependencies);
    preferences.gallery.autoplayActive.on((value) => this.autoplay.toggle(value));
    events.gallery.openedGallery.on(() => this.autoplay.startAutoplay());
    events.gallery.closedGallery.on(() => this.autoplay.stopAutoplay());
    events.gallery.displayedThumb.on((thumb) => this.autoplay.startViewTimer(thumb));
  }
}
