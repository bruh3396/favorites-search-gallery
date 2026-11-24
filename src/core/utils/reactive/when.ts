import { Fact } from "@/core/utils/reactive/fact";
import { Milestone } from "@/core/utils/reactive/milestone";
import { effect } from "@/core/utils/reactive/signal";

export function when(condition: () => boolean): Fact {
  const milestone = new Milestone();

  effect(() => {
    if (!milestone.peek() && condition()) {
      milestone.reach();
    }
  });
  return milestone;
}
