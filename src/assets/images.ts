import * as Icons from "./icons";
import { createObjectURLFromSvg } from "../lib/navigator";

export const REMOVE_FAVORITE_IMAGE_HTML = `<img class="post-action-btn--remove post-action-btn" src=${createObjectURLFromSvg(Icons.HEART_MINUS)}>`;
export const ADD_FAVORITE_IMAGE_HTML = `<img class="post-action-btn--add post-action-btn" src=${createObjectURLFromSvg(Icons.HEART_PLUS)}>`;
export const DOWNLOAD_IMAGE_HTML = `<img class="post-action-btn--download post-action-btn" src=${createObjectURLFromSvg(Icons.DOWNLOAD.replace("FFFFFF", "0075FF"))}>`;
