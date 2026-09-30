import { AppContext } from "@/app/context/context";
import { FavoritesActionFlow } from "@/features/favorites/flows/action";
import { FavoritesControl } from "@/features/favorites/control/control";
import { FavoritesDisplayFlow } from "@/features/favorites/flows/display/display";
import { FavoritesFlowDependencies } from "@/features/favorites/flows/flow";
import { FavoritesInputFlow } from "@/features/favorites/flows/input";
import { FavoritesLoadFlow } from "@/features/favorites/flows/load";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesSearchFlow } from "@/features/favorites/flows/search";
import { FavoritesView } from "@/features/favorites/view/view";

export class FavoritesFlows {
  public readonly action: FavoritesActionFlow;
  public readonly display: FavoritesDisplayFlow;
  public readonly input: FavoritesInputFlow;
  public readonly load: FavoritesLoadFlow;
  public readonly search: FavoritesSearchFlow;

  constructor(context: AppContext, model: FavoritesModel, view: FavoritesView, control: FavoritesControl) {
    const dependencies: FavoritesFlowDependencies = { context, model, view, control, flows: this };

    this.action = new FavoritesActionFlow(dependencies);
    this.display = new FavoritesDisplayFlow(dependencies);
    this.input = new FavoritesInputFlow(dependencies);
    this.load = new FavoritesLoadFlow(dependencies);
    this.search = new FavoritesSearchFlow(dependencies);
  }
}
