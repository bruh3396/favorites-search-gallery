import {DARK_THEME_HTML} from "../../assets/html";
import {ON_MOBILE_DEVICE} from "../../lib/functional/flags";
import {setCookie} from "../../store/cookies/cookie";

function getStyleSheetURL(useDark: boolean): string {
  const platform = ON_MOBILE_DEVICE ? "mobile" : "desktop";
  const darkSuffix = useDark ? "-dark" : "";
  return `https://rule34.xxx//css/${platform}${darkSuffix}.css?44`;
}

function getMainStyleSheetElement(): HTMLLinkElement | undefined {
  return Array.from(document.querySelectorAll("link")).filter(link => link.rel === "stylesheet")[0];
}

function setStyleSheet(url: string): void {
  getMainStyleSheetElement()?.setAttribute("href", url);
}

function toggleDarkStyleSheet(useDark: boolean): void {
  setStyleSheet(getStyleSheetURL(useDark));
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
