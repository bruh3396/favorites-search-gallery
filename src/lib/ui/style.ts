import { COMMON_HTML, CONTENT_HTML, DARK_THEME_HTML } from "../../assets/html";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../environment/environment";
import { SKELETON_CSS, TILE_CSS } from "../../assets/css";
import { getCookie, setCookie } from "../../utils/browser/cookie";
import { GeneralSettings } from "../../config/general_settings";
import { Preferences } from "../preferences/preferences";
import { buildStyleSheetURL } from "../server/url/action_url_builder";
import { insertStyle } from "../../utils/dom/injector";
import { yield1 } from "../core/scheduling/promise";

function getMainStyleSheetElement(): HTMLLinkElement | undefined {
  return Array.from(document.querySelectorAll("link")).filter(link => link.rel === "stylesheet")[0];
}

function setStyleSheet(url: string): void {
  getMainStyleSheetElement()?.setAttribute("href", url);
}

function toggleDarkStyleSheet(useDark: boolean): void {
  setStyleSheet(buildStyleSheetURL(useDark));
}

function toggleGreenGradientClasses(useDark: boolean): void {
  const currentTheme = useDark ? "light-green-gradient" : "dark-green-gradient";
  const targetTheme = useDark ? "dark-green-gradient" : "light-green-gradient";

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
      &.row,
      &.square,
      &.column
      {
        .favorite {
          ${videoRule}
          ${gifRule}
        }
      }

      &.grid,
      &.native
      {
        .favorite {
          >a,
          >div {
            ${videoRule}
            ${gifRule}
          }
        }
      }
    }

    .thumb {
      >a,
      >div {
        ${videoRule}
        ${gifRule}
      }
    }
    `, "video-gif-borders");
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

        .gallery-menu-button:not(:hover) {
          >svg {
              fill: ${color} !important;
              filter: invert(100%);
            }
        }
      `, "gallery-background-color");
}

function setupTilerStyles(): void {

  const style = `
  .row, .column, .column .actual-column, .square, .grid {
    gap: ${GeneralSettings.thumbnailSpacing}px !important;
  }

  #favorites-search-gallery-content.column {
    margin-right: ${ON_DESKTOP_DEVICE ? GeneralSettings.rightContentMargin : 0}px;
  }`;

  insertStyle(style, "tiler-style");
}

export function usingDarkTheme(): boolean {
  return getCookie("theme", "") === "dark";
}

export async function toggleDarkTheme(useDark: boolean): Promise<void> {
  await yield1();
  insertStyle(useDark ? DARK_THEME_HTML : "", "dark-theme");
  toggleDarkStyleSheet(useDark);
  toggleGreenGradientClasses(useDark);
  setCookie("theme", useDark ? "dark" : "light");
}

export function getCurrentThemeClass(): string {
  return usingDarkTheme() ? "dark-green-gradient" : "light-green-gradient";
}

export function setColorScheme(color: string): void {
  setGalleryBackgroundColor(color);
  Preferences.colorScheme.set(color);
}

export function toggleGalleryMenuEnabled(value: boolean): void {
  insertStyle(`
        #gallery-menu {
          visibility: ${value ? "visible" : "hidden"} !important;
        }`, "enable-gallery-menu");
}

export function toggleSavedSearchesVisibility(value: boolean): void {
  insertStyle(`
      #right-favorites-panel {
        display: ${value ? "block" : "none"};
      }
    `, "saved-searches-visibility");
}

export function setupStyles(): void {
  insertStyle(SKELETON_CSS, "skeleton-style");
  insertStyle(COMMON_HTML, "common-style");
  insertStyle(CONTENT_HTML, "content-style");
  insertStyle(TILE_CSS, "tile-style");

  toggleDarkTheme(usingDarkTheme());
  setupVideoAndGifOutlines();
  setupTilerStyles();
}
