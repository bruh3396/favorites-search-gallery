import { PostOverlayFlow } from "@/features/post_overlay/flows/flow";

type OverlayModeHandlers<V> = {
  tag?: (arg: V) => void;
};

export class PostOverlayModeDispatchFlow extends PostOverlayFlow {

  public dispatchByMode<V>(handlers: OverlayModeHandlers<V>, args?: V): void {
    const handler = {
      tag: handlers.tag
    }[this.context.preferences.postOverlay.mode.value];

    handler?.(args as V);
  }
}
