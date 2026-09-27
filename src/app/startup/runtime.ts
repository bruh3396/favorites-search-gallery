import { AppContext } from "@/app/context/context";
import { reloadWindow } from "@/utils/browser/window";
import { ping as setupServer } from "@/lib/remote/fetchers/api";
import { setupStyles } from "@/app/startup/style";

export function setupRuntime(context: AppContext): void {
  context.shell.mount();
  context.domEvents.addEventListeners(context.shell, context.environment, context.events, context.featureBridge);
  setupServer(context.environment.userId, context.environment.version, context.environment.platform);
  setupStyles(context);
  reloadOnRestartPreferences(context);
}

function reloadOnRestartPreferences({ preferences }: AppContext): void {
  preferences.app.fadeThumbs.on(reloadWindow);
  preferences.app.performanceProfile.on(reloadWindow);
}
