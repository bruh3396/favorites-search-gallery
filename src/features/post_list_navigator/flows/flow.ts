import { AppContext } from "@/app/context/context";
import { PostListNavigatorFlows } from "@/features/post_list_navigator/flows/flows";
import { PostListNavigatorModel } from "@/features/post_list_navigator/model/model";
import { PostListNavigatorView } from "@/features/post_list_navigator/view/view";

export interface PostListNavigatorFlowDependencies {
  context: AppContext;
  model: PostListNavigatorModel;
  view: PostListNavigatorView;
  flows: PostListNavigatorFlows;
}

export abstract class PostListNavigatorFlow {
  protected readonly context: AppContext;
  protected readonly model: PostListNavigatorModel;
  protected readonly view: PostListNavigatorView;
  protected readonly flows: PostListNavigatorFlows;

  constructor(dependencies: PostListNavigatorFlowDependencies) {
    this.context = dependencies.context;
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.flows = dependencies.flows;
  }
}
