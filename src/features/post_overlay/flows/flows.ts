import { AppContext } from "@/app/context/context";
import { PostOverlayFlowDependencies } from "@/features/post_overlay/flows/flow";
import { PostOverlayHoverFlow } from "@/features/post_overlay/flows/hover";
import { PostOverlayKeyFlow } from "@/features/post_overlay/flows/key";
import { PostOverlayModeDispatchFlow } from "@/features/post_overlay/flows/mode_dispatch";
import { PostOverlayModel } from "@/features/post_overlay/model/model";
import { PostOverlayTagClickFlow } from "@/features/post_overlay/flows/tag_click";
import { PostOverlayToggleFlow } from "@/features/post_overlay/flows/toggle";
import { PostOverlayView } from "@/features/post_overlay/view/view";

export class PostOverlayFlows {
  public readonly hover: PostOverlayHoverFlow;
  public readonly key: PostOverlayKeyFlow;
  public readonly modeDispatch: PostOverlayModeDispatchFlow;
  public readonly tagClick: PostOverlayTagClickFlow;
  public readonly toggle: PostOverlayToggleFlow;

  constructor(context: AppContext, model: PostOverlayModel, view: PostOverlayView) {
    const dependencies: PostOverlayFlowDependencies = { context, model, view, flows: this };

    this.hover = new PostOverlayHoverFlow(dependencies);
    this.key = new PostOverlayKeyFlow(dependencies);
    this.modeDispatch = new PostOverlayModeDispatchFlow(dependencies);
    this.tagClick = new PostOverlayTagClickFlow(dependencies);
    this.toggle = new PostOverlayToggleFlow(dependencies);
  }
}
