import { GalleryActionsFlow } from "@/features/gallery/flows/actions";
import { GalleryFlowDependencies } from "@/features/gallery/flows/flow";
import { GalleryKeyboardFlow } from "@/features/gallery/flows/keyboard";
import { GalleryMouseFlow } from "@/features/gallery/flows/mouse";
import { GalleryNavigationFlow } from "@/features/gallery/flows/navigation";
import { GalleryThumbsFlow } from "@/features/gallery/flows/thumbs";
import { GalleryTouchFlow } from "@/features/gallery/flows/touch";

export class GalleryFlows {
  public readonly actions: GalleryActionsFlow;
  public readonly keyboard: GalleryKeyboardFlow;
  public readonly mouse: GalleryMouseFlow;
  public readonly navigation: GalleryNavigationFlow;
  public readonly thumbs: GalleryThumbsFlow;
  public readonly touch: GalleryTouchFlow;

  constructor(layers: Omit<GalleryFlowDependencies, "flows">) {
    const dependencies: GalleryFlowDependencies = { ...layers, flows: this };

    this.actions = new GalleryActionsFlow(dependencies);
    this.keyboard = new GalleryKeyboardFlow(dependencies);
    this.mouse = new GalleryMouseFlow(dependencies);
    this.navigation = new GalleryNavigationFlow(dependencies);
    this.thumbs = new GalleryThumbsFlow(dependencies);
    this.touch = new GalleryTouchFlow(dependencies);
  }
}
