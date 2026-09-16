import { AppContext } from "@/app/context/context";
import { PostListNavigatorControl } from "@/features/post_list_navigator/control/control";
import { PostListNavigatorFlows } from "@/features/post_list_navigator/flows/flows";
import { PostListNavigatorModel } from "@/features/post_list_navigator/model/model";
import { PostListNavigatorView } from "@/features/post_list_navigator/view/view";

export interface PostListNavigatorComponents {
  context: AppContext;
  model: PostListNavigatorModel;
  view: PostListNavigatorView;
  flows: PostListNavigatorFlows;
  control: PostListNavigatorControl;
}
