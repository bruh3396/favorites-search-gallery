import { AppContext } from "@/app/context/context";
import { GalleryBackgroundFlow } from "@/features/gallery/flows/background";
import { GalleryControl } from "@/features/gallery/control/control";
import { GalleryClickFlow } from "@/features/gallery/flows/click";
import { GalleryContentFlow } from "@/features/gallery/flows/content";
import { GalleryDispatchFlow } from "@/features/gallery/flows/dispatch";
import { GalleryDisplayFlow } from "@/features/gallery/flows/display";
import { GalleryFavoriterFlow } from "@/features/gallery/flows/favoriter";
import { GalleryFlowDependencies } from "@/features/gallery/flows/flow";
import { GalleryInteractionFlow } from "@/features/gallery/flows/interaction";
import { GalleryKeyFlow } from "@/features/gallery/flows/key";
import { GalleryMenuFlow } from "@/features/gallery/flows/menu";
import { GalleryModel } from "@/features/gallery/model/model";
import { GalleryMouseOverFlow } from "@/features/gallery/flows/mouseover";
import { GalleryNavigationFlow } from "@/features/gallery/flows/navigation";
import { GalleryOpenCloseFlow } from "@/features/gallery/flows/open_close";
import { GalleryPostListFlow } from "@/features/gallery/flows/post_list";
import { GalleryTouchFlow } from "@/features/gallery/flows/touch";
import { GalleryVideoFlow } from "@/features/gallery/flows/video";
import { GalleryView } from "@/features/gallery/view/view";
import { GalleryVisibilityFlow } from "@/features/gallery/flows/visibility";
import { GalleryWheelFlow } from "@/features/gallery/flows/wheel";

export class GalleryFlows {
  public readonly background: GalleryBackgroundFlow;
  public readonly click: GalleryClickFlow;
  public readonly content: GalleryContentFlow;
  public readonly dispatch: GalleryDispatchFlow;
  public readonly display: GalleryDisplayFlow;
  public readonly favoriter: GalleryFavoriterFlow;
  public readonly interaction: GalleryInteractionFlow;
  public readonly key: GalleryKeyFlow;
  public readonly menu: GalleryMenuFlow;
  public readonly mouseOver: GalleryMouseOverFlow;
  public readonly navigation: GalleryNavigationFlow;
  public readonly openClose: GalleryOpenCloseFlow;
  public readonly postList: GalleryPostListFlow;
  public readonly touch: GalleryTouchFlow;
  public readonly video: GalleryVideoFlow;
  public readonly visibility: GalleryVisibilityFlow;
  public readonly wheel: GalleryWheelFlow;

  constructor(context: AppContext, model: GalleryModel, view: GalleryView, control: GalleryControl) {
    const dependencies: GalleryFlowDependencies = { context, model, view, control, flows: this };

    this.background = new GalleryBackgroundFlow(dependencies);
    this.click = new GalleryClickFlow(dependencies);
    this.content = new GalleryContentFlow(dependencies);
    this.dispatch = new GalleryDispatchFlow(dependencies);
    this.display = new GalleryDisplayFlow(dependencies);
    this.favoriter = new GalleryFavoriterFlow(dependencies);
    this.interaction = new GalleryInteractionFlow(dependencies);
    this.key = new GalleryKeyFlow(dependencies);
    this.menu = new GalleryMenuFlow(dependencies);
    this.mouseOver = new GalleryMouseOverFlow(dependencies);
    this.navigation = new GalleryNavigationFlow(dependencies);
    this.openClose = new GalleryOpenCloseFlow(dependencies);
    this.postList = new GalleryPostListFlow(dependencies);
    this.touch = new GalleryTouchFlow(dependencies);
    this.video = new GalleryVideoFlow(dependencies);
    this.visibility = new GalleryVisibilityFlow(dependencies);
    this.wheel = new GalleryWheelFlow(dependencies);
  }
}
