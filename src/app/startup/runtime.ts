import { AppContext } from "@/app/context/context";
import { reloadWindow } from "@/utils/browser/window";
import { setupStyles } from "@/app/startup/style";

export function setupRuntime(context: AppContext): void {
  context.shell.mount();
  context.domEvents.addEventListeners(context.shell, context.environment, context.events, context.featureBridge);
  setupStyles(context);
  reloadOnRestartPreferences(context);
}

function reloadOnRestartPreferences({ preferences }: AppContext): void {
  preferences.app.fadeThumbs.on(reloadWindow);
  preferences.app.performanceProfile.on(reloadWindow);
}
