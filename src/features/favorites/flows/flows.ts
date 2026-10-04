import { FavoritesActionFlow } from "@/features/favorites/flows/action";
import { FavoritesDisplayFlow } from "@/features/favorites/flows/display/display";
import { FavoritesFetchFlow } from "@/features/favorites/flows/fetch";
import { FavoritesFlowDependencies } from "@/features/favorites/flows/flow";
import { FavoritesInputFlow } from "@/features/favorites/flows/input";
import { FavoritesLoadFlow } from "@/features/favorites/flows/load";
import { FavoritesReloadFlow } from "@/features/favorites/flows/reload";
import { FavoritesSearchFlow } from "@/features/favorites/flows/search";

export class FavoritesFlows {
  public readonly action: FavoritesActionFlow;
  public readonly display: FavoritesDisplayFlow;
  public readonly fetch: FavoritesFetchFlow;
  public readonly input: FavoritesInputFlow;
  public readonly load: FavoritesLoadFlow;
  public readonly reload: FavoritesReloadFlow;
  public readonly search: FavoritesSearchFlow;

  constructor(layers: Omit<FavoritesFlowDependencies, "flows">) {
    const dependencies: FavoritesFlowDependencies = { ...layers, flows: this };

    this.action = new FavoritesActionFlow(dependencies);
    this.display = new FavoritesDisplayFlow(dependencies);
    this.fetch = new FavoritesFetchFlow(dependencies);
    this.input = new FavoritesInputFlow(dependencies);
    this.load = new FavoritesLoadFlow(dependencies);
    this.reload = new FavoritesReloadFlow(dependencies);
    this.search = new FavoritesSearchFlow(dependencies);
  }
}
