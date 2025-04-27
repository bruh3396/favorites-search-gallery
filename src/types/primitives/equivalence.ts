import {NavigationKey} from "./primitives";

export function isForwardNavigationKey(key: NavigationKey): boolean {
  return key === "d" || key === "D" || key === "ArrowRight";
}
