import { AppContext } from "@/app/context/context";
import { PostOverlayFlows } from "@/features/post_overlay/flows/flows";
import { PostOverlayModel } from "@/features/post_overlay/model/model";
import { PostOverlayView } from "@/features/post_overlay/view/view";

export interface PostOverlayComponents {
  context: AppContext;
  model: PostOverlayModel;
  view: PostOverlayView;
  flows: PostOverlayFlows;
}
