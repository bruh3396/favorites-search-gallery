import { AppContext } from "@/app/context/context";
import { FavoritesFlows } from "@/features/favorites/flows/flows";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesView } from "@/features/favorites/view/view";

export interface FavoritesFlowDependencies {
  context: AppContext;
  model: FavoritesModel;
  view: FavoritesView;
  flows: FavoritesFlows;
}

export abstract class FavoritesFlow {
  protected readonly context: AppContext;
  protected readonly model: FavoritesModel;
  protected readonly view: FavoritesView;
  protected readonly flows: FavoritesFlows;

  constructor(dependencies: FavoritesFlowDependencies) {
    this.context = dependencies.context;
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.flows = dependencies.flows;
  }
}
