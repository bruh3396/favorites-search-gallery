export type BackwardNavigationKey = "a" | "A" | "ArrowLeft"
export type ForwardNavigationKey = "d" | "D" | "ArrowRight"
export type NavigationKey = BackwardNavigationKey | ForwardNavigationKey
export type ExitKey = "Escape" | "Delete" | "Backspace"
export enum ClickCode {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2
}
