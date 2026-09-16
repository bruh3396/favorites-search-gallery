import { AppContext } from "@/app/context/context";
import { PostListNavigatorFavoritesMarkerFlow } from "@/features/post_list_navigator/flows/favorites_marker";
import { PostListNavigatorFlowDependencies } from "@/features/post_list_navigator/flows/flow";
import { PostListNavigatorInfiniteScrollFlow } from "@/features/post_list_navigator/flows/infinite_scroll";
import { PostListNavigatorModel } from "@/features/post_list_navigator/model/model";
import { PostListNavigatorNavigationFlow } from "@/features/post_list_navigator/flows/navigation";
import { PostListNavigatorOptionFlow } from "@/features/post_list_navigator/flows/option";
import { PostListNavigatorPostActionFlow } from "@/features/post_list_navigator/flows/post_action";
import { PostListNavigatorView } from "@/features/post_list_navigator/view/view";

export class PostListNavigatorFlows {
  public readonly favoritesMarker: PostListNavigatorFavoritesMarkerFlow;
  public readonly infiniteScroll: PostListNavigatorInfiniteScrollFlow;
  public readonly navigation: PostListNavigatorNavigationFlow;
  public readonly option: PostListNavigatorOptionFlow;
  public readonly postAction: PostListNavigatorPostActionFlow;

  constructor(context: AppContext, model: PostListNavigatorModel, view: PostListNavigatorView) {
    const dependencies: PostListNavigatorFlowDependencies = { context, model, view, flows: this };

    this.favoritesMarker = new PostListNavigatorFavoritesMarkerFlow(dependencies);
    this.infiniteScroll = new PostListNavigatorInfiniteScrollFlow(dependencies);
    this.navigation = new PostListNavigatorNavigationFlow(dependencies);
    this.option = new PostListNavigatorOptionFlow(dependencies);
    this.postAction = new PostListNavigatorPostActionFlow(dependencies);
  }
}
