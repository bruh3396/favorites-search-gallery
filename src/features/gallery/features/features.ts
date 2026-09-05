import * as GalleryAutoplay from "@/features/gallery/features/autoplay/autoplay";
import { EnhancedKeyboardEvent } from "@/lib/input";
import { Events } from "@/app/channels/events";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";

type Subscribe<E> = (callback: (event: E) => void, options?: AddEventListenerOptions) => void;

export interface GalleryFeaturesDependencies {
  autoplay: {
    setVideoLooping: (value: boolean) => void;
    onComplete: (direction?: NavigationKey) => void;
    onVideoEndedBeforeMinimumViewTime: () => void;
    subscribeToMouseMove: Subscribe<MouseEvent>;
    subscribeToKeyDown: Subscribe<EnhancedKeyboardEvent>;
  };
}

export function setup(dependencies: GalleryFeaturesDependencies): void {
  setupAutoplay(dependencies.autoplay);
}

function setupAutoplay(dependencies: GalleryFeaturesDependencies["autoplay"]): void {
  GalleryAutoplay.setup(dependencies);
  Preferences.gallery.autoplayActive.on(GalleryAutoplay.toggle);
  Events.gallery.openedGallery.on(GalleryAutoplay.startAutoplay);
  Events.gallery.closedGallery.on(GalleryAutoplay.stopAutoplay);
  Events.gallery.displayedThumb.on(GalleryAutoplay.startViewTimer);
}

export const handleVideoEnded = GalleryAutoplay.handleVideoEnded;
export const showMenu = GalleryAutoplay.showMenu;
