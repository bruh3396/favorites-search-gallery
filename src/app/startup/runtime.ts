import { AppContext } from "@/app/context/context";
import { reloadWindow } from "@/utils/browser/window";
import { setupStyles } from "@/app/startup/style";

export function setupRuntime(context: AppContext, root: HTMLElement): void {
  context.shell.mount(root);
  context.domEvents.addEventListeners(context);
  setupStyles(context);
  reloadOnRestartPreferences(context);
}

function reloadOnRestartPreferences({ preferences }: AppContext): void {
  preferences.app.fadeThumbs.on(reloadWindow);
  preferences.app.performanceProfile.on(reloadWindow);
}
