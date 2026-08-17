import { ITEM_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/thumb/thumbs";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { actionBarHtml } from "@/lib/thumb/action_bar/bar";

export const favoriteElementTemplate: HTMLElement = new DOMParser().parseFromString("", "text/html").createElement("div");

export function buildFavoriteElementTemplate(): void {
favoriteElementTemplate.className = `${ITEM_CLASS_NAME} ${TILE_CLASS_NAME}`;
const canvas = GALLERY_DISABLED ? "" : "<canvas></canvas>";

favoriteElementTemplate.innerHTML = `
  <a>
    <img decoding="async">
    ${canvas}
    ${actionBarHtml(USER_IS_ON_THEIR_OWN_FAVORITES_PAGE)}
  </a>
`;
}
