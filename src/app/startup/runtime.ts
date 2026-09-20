import { AppContext } from "@/app/context/context";
import { setupAutocomplete } from "@/lib/ui/autocomplete/autocomplete";
import { ping as setupServer } from "@/lib/remote/fetchers/api";
import { setupStyles } from "@/app/startup/style";

export function setupRuntime(context: AppContext): void {
  setupServer(context.environment.userId, context.environment.version, context.environment.platform);
  context.domEvents.addEventListeners(context.shell, context.environment, context.events, context.featureBridge);
  setupAutocomplete(context.environment.onFavoritesPage);
  setupStyles(context);
}
