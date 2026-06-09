import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import ELEMENTS_CSS from "@/assets/css/base/elements.css";
import INDICATOR_CSS from "@/assets/css/base/indicator.css";
import SKELETON_CSS from "@/assets/css/favorites/skeleton.css";
import THEMES_CSS from "@/assets/css/base/themes.css";
import THUMB_CSS from "@/assets/css/base/thumb.css";
import THUMB_FADE_IN_CSS from "@/assets/css/base/fade_in.css";
import THUMB_LOADING_CSS from "@/assets/css/base/loading.css";
import TILE_CSS from "@/assets/css/base/tile.css";
import { Theme } from "@/types/ui";
import { ThumbConfig } from "@/config/thumb_config";
import UTILITIES_CSS from "@/assets/css/base/utilities.css";
import VARIABLES_CSS from "@/assets/css/base/variables.css";
import WIDGETS_CSS from "@/assets/css/base/widgets.css";
import { insertStyle } from "@/utils/dom/injector";
import { setCookie } from "@/utils/browser/cookie";
import { yieldControl } from "@/lib/async/timing";

export function setupStyles(theme: Theme): void {
  const fadeInCss = ThumbConfig.fadeIn ? THUMB_FADE_IN_CSS : "";

  insertStyle(VARIABLES_CSS +
    ELEMENTS_CSS +
    UTILITIES_CSS +
    WIDGETS_CSS +
    SKELETON_CSS +
    THUMB_CSS +
    TILE_CSS +
    INDICATOR_CSS +
    THEMES_CSS +
    THUMB_LOADING_CSS +
    fadeInCss);
  applyTheme(theme);
  setupVideoAndGifOutlines();
  setupTilerStyles();
}

export async function applyTheme(theme: Theme): Promise<void> {
  await yieldControl();
  document.documentElement.dataset.theme = theme;
  syncNativeCookie(theme);
}

export function setColorScheme(color: string): void {
  setGalleryBackgroundColor(color);
}

export function toggleGalleryMenuEnabled(value: boolean): void {
  insertStyle(`
        #gallery-menu {
          visibility: ${value ? "visible" : "hidden"} !important;
        }`, "gallery-menu-enable");
}

export function toggleSavedSearchesVisibility(value: boolean): void {
  insertStyle(`
      #right-favorites-panel {
        display: ${value ? "block" : "none"};
      }
    `, "saved-searches-visibility");
}

function syncNativeCookie(theme: Theme): void {
  const nativeCookies: Partial<Record<Theme, string>> = {
    "native-dark": "dark",
    "native-light": "light"
  };
  const cookieValue = nativeCookies[theme];

  if (cookieValue !== undefined) {
    setCookie("theme", cookieValue);
  }
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

function setGalleryBackgroundColor(color: string): void {
  insertStyle(`
        #gallery-background,
        #gallery-menu,
        #gallery-menu-button-container,
        #autoplay-menu,
        #autoplay-settings-menu {
          background: ${color} !important;
        }

        .gallery-menu-btn:not(:hover) {
          >svg {
              fill: ${color} !important;
              filter: invert(100%);
            }
        }
      `, "gallery-bg-color");
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
