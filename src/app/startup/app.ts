import { Environment } from "@/core/boundary/environment";
import { Ports } from "@/core/boundary/ports";
import { createAppContext } from "@/app/context/context";
import { launchFeatures } from "@/app/startup/features";
import { setupRuntime } from "@/app/startup/runtime";

export function startApp(environment: Environment, ports: Ports): void {
  const context = createAppContext(environment, ports);

  if (context.flags.favoritesSearchGalleryDisabled) {
    return;
  }
  ports.telemetry.announce(environment);
  ports.host.takeOver(environment.mode);
  setupRuntime(context);
  launchFeatures(context);
}
