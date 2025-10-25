import * as Icons from "./icons";
import { createObjectURLFromSvg } from "../utils/dom/links";

export const REMOVE_FAVORITE_IMAGE_HTML = `<img class="remove-favorite-button utility-button" src=${createObjectURLFromSvg(Icons.HEART_MINUS)}>`;
export const ADD_FAVORITE_IMAGE_HTML = `<img class="add-favorite-button utility-button" src=${createObjectURLFromSvg(Icons.HEART_PLUS)}>`;
export const DOWNLOAD_IMAGE_HTML = `<img class="download-button utility-button" src=${createObjectURLFromSvg(Icons.DOWNLOAD.replace("FFFFFF", "0075FF"))}>`;
