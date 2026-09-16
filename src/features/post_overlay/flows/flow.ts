import { AppContext } from "@/app/context/context";
import { PostOverlayFlows } from "@/features/post_overlay/flows/flows";
import { PostOverlayModel } from "@/features/post_overlay/model/model";
import { PostOverlayView } from "@/features/post_overlay/view/view";

export interface PostOverlayFlowDependencies {
  context: AppContext;
  model: PostOverlayModel;
  view: PostOverlayView;
  flows: PostOverlayFlows;
}

export abstract class PostOverlayFlow {
  protected readonly context: AppContext;
  protected readonly model: PostOverlayModel;
  protected readonly view: PostOverlayView;
  protected readonly flows: PostOverlayFlows;

  constructor(dependencies: PostOverlayFlowDependencies) {
    this.context = dependencies.context;
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.flows = dependencies.flows;
  }
}
