import { Lightbox, LightboxDependencies } from "@/core/features/lightbox/types/lightbox";
import { LightboxNavigationFlow } from "@/core/features/lightbox/flows/navigation";

export function startLightbox(dependencies: LightboxDependencies): Lightbox {
  const navigation = new LightboxNavigationFlow(dependencies);
  return {
    isOpen: navigation.isOpen,
    current: navigation.current,
    intents: {
      open: (post): void => navigation.open(post),
      close: (): void => navigation.close(),
      showNext: (): Promise<void> => navigation.showNext(),
      showPrevious: (): Promise<void> => navigation.showPrevious()
    }
  };
}
