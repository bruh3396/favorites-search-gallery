import { ADD_FAVORITE_IMAGE_HTML, DOWNLOAD_IMAGE_HTML, REMOVE_FAVORITE_IMAGE_HTML } from "../../../assets/images";
import { GALLERY_DISABLED } from "../../../lib/environment/derived_environment";
import { ITEM_CLASS_NAME } from "../../../lib/dom/thumb";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../lib/environment/favorites_metadata";
import { domParser } from "../../../utils/dom/dom_parser";

export const favoriteElementTemplate: HTMLElement = domParser.parseFromString("", "text/html").createElement("div");

export function buildFavoriteElementTemplate(): void {
favoriteElementTemplate.className = ITEM_CLASS_NAME;
const canvas = GALLERY_DISABLED ? "" : "<canvas></canvas>";
const favoriteButton = USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? REMOVE_FAVORITE_IMAGE_HTML : ADD_FAVORITE_IMAGE_HTML;

favoriteElementTemplate.innerHTML = `
  <a>
    <img>
    ${favoriteButton}
    ${DOWNLOAD_IMAGE_HTML}
    ${canvas}
  </a>
`;
}
