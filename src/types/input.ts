export type BackwardNavigationKey = "a" | "A" | "ArrowLeft";
export type ForwardNavigationKey = "d" | "D" | "ArrowRight";
export type NavigationKey = BackwardNavigationKey | ForwardNavigationKey;
export type ExitKey = "Escape" | "Delete" | "Backspace";
export type TypeableInput = "color" | "email" | "number" | "password" | "search" | "tel" | "text" | "url" | "datetime";

export enum ClickCode {
  Left = 0,
  Middle = 1,
  Right = 2
}
