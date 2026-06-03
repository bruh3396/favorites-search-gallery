import * as PostOverlayModel from "../model/post_overlay_model";

type OverlayModeHandlers<V> = {
  tags?: (arg: V) => void
};

export function dispatchByMode<V>(handlers: OverlayModeHandlers<V>, args?: V): void {
  const handler = {
    tags: handlers.tags
  }[PostOverlayModel.getMode()];

  handler?.(args as V);
}
