import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { applySurfaceGradient, applyTheme } from "@/lib/ui/style";
import ELEMENTS_CSS from "@/assets/css/base/elements.css";
import INDICATOR_CSS from "@/assets/css/base/indicator.css";
import POST_CSS from "@/assets/css/base/post.css";
import { Preferences } from "@/app/context/preferences";
import SKELETON_CSS from "@/assets/css/favorites/skeleton.css";
import THEMES_CSS from "@/assets/css/base/themes.css";
import THUMB_FADE_IN_CSS from "@/assets/css/base/fade_in.css";
import THUMB_LOADING_CSS from "@/assets/css/base/loading.css";
import TILE_CSS from "@/assets/css/base/tile.css";
import { ThumbConfig } from "@/config/thumb_config";
import UTILITIES_CSS from "@/assets/css/base/utilities.css";
import VARIABLES_CSS from "@/assets/css/base/variables.css";
import WIDGETS_CSS from "@/assets/css/base/widgets.css";
import { insertStyle } from "@/utils/dom/injector";

export function setupStyles(): void {
  insertBaseStyles();
  applyTheme(Preferences.appTheme.value);
  applySurfaceGradient(Preferences.appSurfaceGradient.value);
  setupVideoAndGifOutlines();
  setupTilerStyles();
}

function insertBaseStyles(): void {
  const fadeInCss = ThumbConfig.fadeIn ? THUMB_FADE_IN_CSS : "";

  insertStyle(VARIABLES_CSS +
    ELEMENTS_CSS +
    UTILITIES_CSS +
    WIDGETS_CSS +
    SKELETON_CSS +
    POST_CSS +
    TILE_CSS +
    INDICATOR_CSS +
    THEMES_CSS +
    THUMB_LOADING_CSS +
    fadeInCss);
}

function setupVideoAndGifOutlines(): void {
  const size = ON_MOBILE_DEVICE ? 1 : 2;
  const videoSelector = "&:has(img.video)";
  const gifSelector = "&:has(img.gif)";
  const videoRule = `${videoSelector} {outline: ${size}px solid blue}`;
  const gifRule = `${gifSelector} {outline: ${size}px solid hotpink}`;

  insertStyle(`
    #favorites-search-gallery-content {
      &[data-layout="row"],
      &[data-layout="square"],
      &[data-layout="column"]
      {
        .post {
          ${videoRule}
          ${gifRule}
        }
      }

      &[data-layout="grid"],
      &[data-layout="native"]
      {
        .post {
          >a,
          >div {
            ${videoRule}
            ${gifRule}
          }
        }
      }
    }
    `, "gallery-media-borders");
}

function setupTilerStyles(): void {

  const style = `
  [data-layout="row"], [data-layout="column"], [data-layout="column"] [data-tiler-column], [data-layout="square"], [data-layout="grid"] {
    gap: ${ThumbConfig.spacing}px !important;
  }

  #favorites-search-gallery-content[data-layout="column"] {
    margin-right: ${ON_DESKTOP_DEVICE ? ThumbConfig.rightContentMargin : 0}px;
  }`;

  insertStyle(style, "fav-tiler");
}
