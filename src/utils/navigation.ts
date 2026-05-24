import { NavigationKey } from "../types/input";
import { isForwardNavigationKey } from "../types/guards";

export function navigationDelta(direction: NavigationKey): 1 | -1 {
  return isForwardNavigationKey(direction) ? 1 : -1;
}
