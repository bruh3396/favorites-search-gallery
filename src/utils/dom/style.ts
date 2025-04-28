import * as FSG_URL from "../../lib/api/url";
import {DARK_THEME_HTML, SKELETON_HTML, UTILITIES_HTML} from "../../assets/html";
import {getCookie, setCookie} from "../../store/cookies/cookie";

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

export function toggleDarkTheme(useDark: boolean): void {
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

export function setupCommonStyles(): void {
  insertStyleHTML(SKELETON_HTML, "skeleton-style");
  insertStyleHTML(UTILITIES_HTML, "common-style");
  toggleDarkTheme(getCookie("theme", "") === "dark");
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
