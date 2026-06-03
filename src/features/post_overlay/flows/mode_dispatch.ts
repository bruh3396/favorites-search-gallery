import { Preferences } from "../../../app/context/preferences";

type OverlayModeHandlers<V> = {
  tag?: (arg: V) => void
};

export function dispatchByMode<V>(handlers: OverlayModeHandlers<V>, args?: V): void {
  const handler = {
    tag: handlers.tag
  }[Preferences.overlayMode.value];

  handler?.(args as V);
}
