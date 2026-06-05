import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import COMMON_CSS from "@/assets/css/base/common.css";
import CONTENT_CSS from "@/assets/css/base/content.css";
import { Preferences } from "@/app/context/preferences";
import SKELETON_CSS from "@/assets/css/base/skeleton.css";
import THEMES_CSS from "@/assets/css/base/themes.css";
import THUMB_FADE_IN_CSS from "@/assets/css/thumbs/thumb_fade_in.css";
import TILE_CSS from "@/assets/css/thumbs/tile.css";
import { Theme } from "@/types/ui";
import { ThumbConfig } from "@/config/thumb_config";
import { insertStyle } from "@/utils/dom/injector";
import { setCookie } from "@/utils/browser/cookie";
import { yieldControl } from "@/lib/async/timing";

export function setupStyles(): void {
  const fadeInCss = ThumbConfig.fadeIn ? THUMB_FADE_IN_CSS : "";

  insertStyle(SKELETON_CSS + COMMON_CSS + CONTENT_CSS + TILE_CSS + THEMES_CSS + fadeInCss);
  applyTheme(Preferences.theme.value);
  setupVideoAndGifOutlines();
  setupTilerStyles();
}

export async function applyTheme(theme: Theme): Promise<void> {
  await yieldControl();
  Preferences.theme.set(theme);
  document.documentElement.dataset.theme = theme;
  syncNativeCookie(theme);
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

function setupVideoAndGifOutlines(): void {
  const size = ON_MOBILE_DEVICE ? 1 : 2;
  const videoSelector = "&:has(img.video)";
  const gifSelector = "&:has(img.gif)";
  const videoRule = `${videoSelector} {outline: ${size}px solid blue}`;
  const gifRule = `${gifSelector} {outline: ${size}px solid hotpink}`;

  insertStyle(`
    #favorites-search-gallery-content {
      &.tiler--row,
      &.tiler--square,
      &.tiler--column
      {
        .post {
          ${videoRule}
          ${gifRule}
        }
      }

      &.tiler--grid,
      &.tiler--native
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
  .tiler--row, .tiler--column, .tiler--column .tiler--column--a, .tiler--square, .tiler--grid {
    gap: ${ThumbConfig.spacing}px !important;
  }

  #favorites-search-gallery-content.tiler--column {
    margin-right: ${ON_DESKTOP_DEVICE ? ThumbConfig.rightContentMargin : 0}px;
  }`;

  insertStyle(style, "fav-tiler");
}
