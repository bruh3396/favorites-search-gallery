import { ITEM_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/thumb/thumbs";
import { GALLERY_DISABLED } from "@/app/context/flags";

export const favoriteElementTemplate: HTMLElement = new DOMParser().parseFromString("", "text/html").createElement("div");

export function buildElementTemplate(): void {
favoriteElementTemplate.className = `${ITEM_CLASS_NAME} ${TILE_CLASS_NAME}`;
const canvas = GALLERY_DISABLED ? "" : "<canvas></canvas>";

favoriteElementTemplate.innerHTML = `
  <a>
    <img>
    ${canvas}
  </a>
`;
}
