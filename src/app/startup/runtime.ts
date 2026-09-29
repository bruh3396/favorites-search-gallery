import { AppContext } from "@/app/context/context";
import { purgeObsoleteDatabases } from "@/lib/storage/obsolete_databases";
import { reloadWindow } from "@/utils/browser/window";
import { setupStyles } from "@/app/startup/style";

export function setupRuntime(context: AppContext, root: HTMLElement): void {
  context.shell.mount(root);
  context.domEvents.addEventListeners(context.shell, context.environment, context.events, context.featureBridge);
  setupStyles(context);
  reloadOnRestartPreferences(context);
  purgeObsoleteDatabases();
}

function reloadOnRestartPreferences({ preferences }: AppContext): void {
  preferences.app.fadeThumbs.on(reloadWindow);
  preferences.app.performanceProfile.on(reloadWindow);
}
