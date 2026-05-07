import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../environment/environment";
import { getCookie, setCookie } from "../../utils/browser/cookie";
import COMMON_CSS from "../../assets/css/common.css";
import CONTENT_CSS from "../../assets/css/content.css";
import DARK_THEME_CSS from "../../assets/css/dark_theme.css";
import { Preferences } from "../preferences/preferences";
import SKELETON_CSS from "../../assets/css/skeleton.css";
import TILE_CSS from "../../assets/css/tile.css";
import { ThumbnailConfig } from "../../config/thumbnail_config";
import { buildStyleSheetURL } from "../remote/url/action_url_builder";
import { insertStyle } from "../dom/injector";
import { yieldControl } from "../core/scheduling/promise";

function getMainStyleSheetElement(): HTMLLinkElement | undefined {
  return Array.from(document.querySelectorAll("link")).filter(link => link.rel === "stylesheet")[0];
}

function setStyleSheet(url: string): void {
  getMainStyleSheetElement()?.setAttribute("href", url);
}

function toggleDarkStyleSheet(useDark: boolean): void {
  setStyleSheet(buildStyleSheetURL(ON_MOBILE_DEVICE ? "mobile" : "desktop", useDark));
}

function toggleGreenGradientClasses(useDark: boolean): void {
  const currentTheme = useDark ? "theme--light" : "theme--dark";
  const targetTheme = useDark ? "theme--dark" : "theme--light";

  for (const element of Array.from(document.querySelectorAll(`.${currentTheme}`))) {
    element.classList.remove(currentTheme);
    element.classList.add(targetTheme);
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

    .post--thumb {
      >a,
      >div {
        ${videoRule}
        ${gifRule}
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

        .gallery-menu__btn:not(:hover) {
          >svg {
              fill: ${color} !important;
              filter: invert(100%);
            }
        }
      `, "gallery-bg-color");
}

function setupTilerStyles(): void {

  const style = `
  .tiler--row, .tiler--column, .tiler--column .tiler__column, .tiler--square, .tiler--grid {
    gap: ${ThumbnailConfig.thumbnailSpacing}px !important;
  }

  #favorites-search-gallery-content.tiler--column {
    margin-right: ${ON_DESKTOP_DEVICE ? ThumbnailConfig.rightContentMargin : 0}px;
  }`;

  insertStyle(style, "fav-tiler");
}

export function usingDarkTheme(): boolean {
  return getCookie("theme", "") === "dark";
}

export async function toggleDarkTheme(useDark: boolean): Promise<void> {
  await yieldControl();
  insertStyle(useDark ? DARK_THEME_CSS : "", "theme-dark");
  toggleDarkStyleSheet(useDark);
  toggleGreenGradientClasses(useDark);
  setCookie("theme", useDark ? "dark" : "light");
}

export function getCurrentThemeClass(): string {
  return usingDarkTheme() ? "theme--dark" : "theme--light";
}

export function setColorScheme(color: string): void {
  setGalleryBackgroundColor(color);
  Preferences.colorScheme.set(color);
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

export function setupStyles(): void {
  insertStyle(SKELETON_CSS + COMMON_CSS + CONTENT_CSS + TILE_CSS);

  toggleDarkTheme(usingDarkTheme());
  setupVideoAndGifOutlines();
  setupTilerStyles();
}
