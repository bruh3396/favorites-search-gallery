import { Lightbox, LightboxDependencies } from "@/core/features/lightbox/types/lightbox";
import { LightboxNavigationFlow } from "@/core/features/lightbox/flows/navigation";
import { MediaItem } from "@/core/domain/post/post";

export function createLightbox<T extends MediaItem>(dependencies: LightboxDependencies<T>): Lightbox<T> {
  const navigation = new LightboxNavigationFlow(dependencies);
  return {
    isOpen: navigation.isOpen,
    current: navigation.current,
    intents: {
      open: (item): void => navigation.open(item),
      close: (): void => navigation.close(),
      showNext: (): Promise<void> => navigation.showNext(),
      showPrevious: (): Promise<void> => navigation.showPrevious()
    }
  };
}
