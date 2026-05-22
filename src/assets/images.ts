import * as Icons from "./icons";
import { createObjectUrlFromSvg } from "../lib/dom/navigation";

export const REMOVE_FAVORITE_IMAGE_HTML = `<img class="post-action-btn--remove post-action-btn" src=${createObjectUrlFromSvg(Icons.HEART_MINUS)}>`;
export const ADD_FAVORITE_IMAGE_HTML = `<img class="post-action-btn--add post-action-btn" src=${createObjectUrlFromSvg(Icons.HEART_PLUS)}>`;
export const DOWNLOAD_IMAGE_HTML = `<img class="post-action-btn--download post-action-btn" src=${createObjectUrlFromSvg(Icons.DOWNLOAD.replace("FFFFFF", "0075FF"))}>`;
