import { ActionBarDataset, ActionBarSelectors } from "@/lib/thumb/action_bar/selectors";
import { ActionBarAction } from "@/lib/thumb/action_bar/types";
import { Svg } from "@/assets/svg";
import { toKebabCase } from "@/utils/string/format";
import { toggleDataset } from "@/utils/dom/dataset";

export function actionBarHtml(isFavorite: boolean): string {
  const favoriteState = isFavorite ? ` data-${toKebabCase(ActionBarDataset.isFavorite)}` : "";
  return `<div class="${ActionBarSelectors.bar}"${favoriteState}>${favoriteButton()}${downloadButton()}</div>`;
}

export function setActionBarEnabled(isEnabled: boolean): void {
  toggleDataset(document.documentElement, ActionBarDataset.enabled, isEnabled);
}

export function setActionBarStatic(isStatic: boolean): void {
  toggleDataset(document.documentElement, ActionBarDataset.static, isStatic);
}

export function setFavorite(bar: HTMLElement, isFavorite: boolean): void {
  toggleDataset(bar, ActionBarDataset.isFavorite, isFavorite);
}

function favoriteButton(): string {
  return actionButton("favorite", `<span class="${ActionBarSelectors.heartEmpty}">${Svg.heart}</span><span class="${ActionBarSelectors.heartFilled}">${Svg.heartFilled}</span>`);
}

function downloadButton(): string {
  return actionButton("download", Svg.download);
}

function actionButton(action: ActionBarAction, innerHTML: string): string {
  return `<button type="button" class="${ActionBarSelectors.button}" data-action="${action}">${innerHTML}</button>`;
}
