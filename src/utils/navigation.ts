import { NavigationKey } from "@/types/input";
import { isForwardNavigationKey } from "@/types/guards";

export function navigationDelta(direction: NavigationKey): number {
  return isForwardNavigationKey(direction) ? 1 : -1;
}
