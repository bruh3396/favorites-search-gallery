import { AppContext } from "@/app/context/context";
import { GalleryActionsFlow } from "@/features/gallery/flows/actions";
import { GalleryControl } from "@/features/gallery/control/control";
import { GalleryFlowDependencies } from "@/features/gallery/flows/flow";
import { GalleryKeyboardFlow } from "@/features/gallery/flows/keyboard";
import { GalleryModel } from "@/features/gallery/model/model";
import { GalleryMouseFlow } from "@/features/gallery/flows/mouse";
import { GalleryNavigationFlow } from "@/features/gallery/flows/navigation";
import { GalleryThumbsFlow } from "@/features/gallery/flows/thumbs";
import { GalleryTouchFlow } from "@/features/gallery/flows/touch";
import { GalleryView } from "@/features/gallery/view/view";

export class GalleryFlows {
  public readonly actions: GalleryActionsFlow;
  public readonly keyboard: GalleryKeyboardFlow;
  public readonly mouse: GalleryMouseFlow;
  public readonly navigation: GalleryNavigationFlow;
  public readonly thumbs: GalleryThumbsFlow;
  public readonly touch: GalleryTouchFlow;

  constructor(context: AppContext, model: GalleryModel, view: GalleryView, control: GalleryControl) {
    const dependencies: GalleryFlowDependencies = { context, model, view, control, flows: this };

    this.actions = new GalleryActionsFlow(dependencies);
    this.keyboard = new GalleryKeyboardFlow(dependencies);
    this.mouse = new GalleryMouseFlow(dependencies);
    this.navigation = new GalleryNavigationFlow(dependencies);
    this.thumbs = new GalleryThumbsFlow(dependencies);
    this.touch = new GalleryTouchFlow(dependencies);
  }
}
