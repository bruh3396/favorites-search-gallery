import { ActionBarDataset, ActionBarSelectors } from "@/lib/thumb/action_bar/selectors";
import { ActionBarAction } from "@/lib/thumb/action_bar/types";
import { Svg } from "@/assets/svg";
import { camelToKebabCase } from "@/utils/pure/string";

export function actionBarHtml(isFavorite: boolean): string {
  const favoriteState = isFavorite ? ` data-${camelToKebabCase(ActionBarDataset.isFavorite)}` : "";
  return `<div class="${ActionBarSelectors.bar}"${favoriteState}><span class="${ActionBarSelectors.id}"></span>${downloadButton()}${favoriteButton()}</div>`;
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
