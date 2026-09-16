import { AppContext } from "@/app/context/context";
import { FavoritesDisplayFlow } from "@/features/favorites/flows/display/display";
import { FavoritesFlowDependencies } from "@/features/favorites/flows/flow";
import { FavoritesInputFlow } from "@/features/favorites/flows/input";
import { FavoritesLoadFlow } from "@/features/favorites/flows/load";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesResetFlow } from "@/features/favorites/flows/reset";
import { FavoritesSearchFlow } from "@/features/favorites/flows/search";
import { FavoritesView } from "@/features/favorites/view/view";

export class FavoritesFlows {
  public readonly display: FavoritesDisplayFlow;
  public readonly input: FavoritesInputFlow;
  public readonly load: FavoritesLoadFlow;
  public readonly reset: FavoritesResetFlow;
  public readonly search: FavoritesSearchFlow;

  constructor(context: AppContext, model: FavoritesModel, view: FavoritesView) {
    const dependencies: FavoritesFlowDependencies = { context, model, view, flows: this };

    this.display = new FavoritesDisplayFlow(dependencies);
    this.input = new FavoritesInputFlow(dependencies);
    this.load = new FavoritesLoadFlow(dependencies);
    this.reset = new FavoritesResetFlow(dependencies);
    this.search = new FavoritesSearchFlow(dependencies);
  }
}
