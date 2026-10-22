import { Occurrence } from "@/core/utils/reactive/emitter";

export interface PageVisibility {
  readonly hidden: Occurrence<void>;
}
