import * as FSG_URL from "../../lib/api/api_url";
import { COMMON_HTML, DARK_THEME_HTML, SKELETON_HTML } from "../../assets/html";
import { ON_FAVORITES_PAGE, ON_MOBILE_DEVICE } from "../../lib/global/flags/intrinsic_flags";
import { getCookie, setCookie } from "../../lib/global/cookie";
import { Preferences } from "../../lib/global/preferences/preferences";
import { yield1 } from "../misc/async";

function getMainStyleSheetElement(): HTMLLinkElement | undefined {
  return Array.from(document.querySelectorAll("link")).filter(link => link.rel === "stylesheet")[0];
}

function setStyleSheet(url: string): void {
  getMainStyleSheetElement()?.setAttribute("href", url);
}

function toggleDarkStyleSheet(useDark: boolean): void {
  setStyleSheet(FSG_URL.getStyleSheetURL(useDark));
}

function toggleLocalDarkStyles(useDark: boolean): void {
  const currentTheme = useDark ? "light-green-gradient" : "dark-green-gradient";
  const targetTheme = useDark ? "dark-green-gradient" : "light-green-gradient";

  for (const element of Array.from(document.querySelectorAll(`.${currentTheme}`))) {
    element.classList.remove(currentTheme);
    element.classList.add(targetTheme);
  }
}

function setupVideoAndGifOutlines(): void {
  const size = ON_MOBILE_DEVICE ? 1 : 2;
  const videoSelector = ON_FAVORITES_PAGE ? "&:has(img.video)" : ">img.video";
  const gifSelector = ON_FAVORITES_PAGE ? "&:has(img.gif)" : ">img.gif";
  const videoRule = `${videoSelector} {outline: ${size}px solid blue}`;
  const gifRule = `${gifSelector} {outline: ${size}px solid hotpink}`;

  insertStyleHTML(`
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
    }

    #favorites-search-gallery-content {
      &.grid,
      &.native
      {
        .favorite, .thumb {
          >a,
          >div {
            ${videoRule}
            ${gifRule}
          }
        }
      }
    }
    `, "video-gif-borders");
}

export async function toggleDarkTheme(useDark: boolean): Promise<void> {
  await yield1();
  insertStyleHTML(useDark ? DARK_THEME_HTML : "", "dark-theme");
  toggleDarkStyleSheet(useDark);
  toggleLocalDarkStyles(useDark);
  setCookie("theme", useDark ? "dark" : "light");
}

export function insertStyleHTML(html: string, id: string | undefined = undefined): void {
  const style = document.createElement("style");

  style.textContent = html.replace("<style>", "").replace("</style>", "");

  if (id !== undefined) {
    id += "-fsg-style";
    const oldStyle = document.getElementById(id);

    if (oldStyle !== null) {
      oldStyle.remove();
    }
    style.id = id;
  }
  document.head.appendChild(style);
}

export function usingDarkTheme(): boolean {
  return getCookie("theme", "") === "dark";
}

export function getCurrentThemeClass(): string {
  return usingDarkTheme() ? "dark-green-gradient" : "light-green-gradient";
}

export function insertHTMLAndExtractStyle(element: HTMLElement, position: InsertPosition, html: string): void {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const styles = Array.from(dom.querySelectorAll("style"));

  for (const style of styles) {
    insertStyleHTML(style.innerHTML);
    style.remove();
  }
  element.insertAdjacentHTML(position, dom.body.innerHTML);
}
export function setupCommonStyles(): void {
  insertStyleHTML(SKELETON_HTML, "skeleton-style");
  insertStyleHTML(COMMON_HTML, "common-style");
  toggleDarkTheme(usingDarkTheme());
  setupVideoAndGifOutlines();
}

function setGalleryBackgroundColor(color: string): void {
  insertStyleHTML(`
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

export function setColorScheme(color: string): void {
  setGalleryBackgroundColor(color);
  Preferences.colorScheme.set(color);
}
