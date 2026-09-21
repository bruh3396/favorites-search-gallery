import { AppContext } from "@/app/context/context";
import { FavoritesControl } from "@/features/favorites/control/control";
import { FavoritesDisplayFlow } from "@/features/favorites/flows/display/display";
import { FavoritesFlowDependencies } from "@/features/favorites/flows/flow";
import { FavoritesInputFlow } from "@/features/favorites/flows/input";
import { FavoritesLoadFlow } from "@/features/favorites/flows/load";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesResetFlow } from "@/features/favorites/flows/reset";
import { FavoritesScratchFlow } from "@/features/favorites/flows/scratch";
import { FavoritesSearchFlow } from "@/features/favorites/flows/search";
import { FavoritesView } from "@/features/favorites/view/view";

export class FavoritesFlows {
  public readonly display: FavoritesDisplayFlow;
  public readonly input: FavoritesInputFlow;
  public readonly load: FavoritesLoadFlow;
  public readonly reset: FavoritesResetFlow;
  public readonly scratch: FavoritesScratchFlow;
  public readonly search: FavoritesSearchFlow;

  constructor(context: AppContext, model: FavoritesModel, view: FavoritesView, control: FavoritesControl) {
    const dependencies: FavoritesFlowDependencies = { context, model, view, control, flows: this };

    this.display = new FavoritesDisplayFlow(dependencies);
    this.input = new FavoritesInputFlow(dependencies);
    this.load = new FavoritesLoadFlow(dependencies);
    this.reset = new FavoritesResetFlow(dependencies);
    this.scratch = new FavoritesScratchFlow(dependencies);
    this.search = new FavoritesSearchFlow(dependencies);
  }
}
