import { AppFont } from "@/core/ui/fonts/app_font";
import { installAppFont } from "@/core/ui/fonts/app_font_installer";
import { DEFAULT_THEME, THEME_DEFINITIONS } from "@/core/ui/theme/theme";
import { applyTheme } from "@/core/ui/theme/theme_applier";
import { Story, StoryVariant } from "@/targets/kit/story";
import { h, render } from "@/core/ui/h/h";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { GEIST_FONT } from "@/core/ui/fonts/geist_font";
import { INSTRUMENT_FONT } from "@/core/ui/fonts/instrument_font";
import { INTER_FONT } from "@/core/ui/fonts/inter_font";
import KIT_CSS from "@/targets/kit/kit.css?inline";
import { PLEX_FONT } from "@/core/ui/fonts/plex_font";
import { SYSTEM_FONT } from "@/core/ui/fonts/system_font";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { Signal } from "@/core/utils/reactive/signal";
import { Switch } from "@/core/ui/components/switch/switch";
import UI_CSS from "@/core/ui/styles.css?inline";
import { VERDANA_FONT } from "@/core/ui/fonts/verdana_font";

interface StoryEntry {
  readonly id: string;
  readonly story: Story;
}

const STORY_MODULES = import.meta.glob<Record<string, Story>>("./stories/*.tsx", { eager: true });

const STORIES: readonly StoryEntry[] = Object.entries(STORY_MODULES)
  .flatMap(([path, exports]) => Object.values(exports).map(story => ({ id: readStoryId(path), story })))
  .sort((a, b) => a.story.title.localeCompare(b.story.title));

function readStoryId(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf(".")).replaceAll("_", "-");
}

function createStyleSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(css);
  return sheet;
}

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, textContent = ""): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  element.className = className;
  element.textContent = textContent;
  return element;
}

function renderVariant(variant: StoryVariant, log: (message: string) => void): HTMLElement {
  const item = createElement("li", "kit-Variant");

  item.append(createElement("span", "kit-Variant-label", variant.label), variant.render(document, log));
  return item;
}

function renderStory(story: Story, log: (message: string) => void): HTMLElement {
  const section = createElement("section", "kit-Story");
  const variants = createElement("ul", "kit-Story-variants");

  variants.append(...story.variants.map(variant => renderVariant(variant, log)));
  section.append(createElement("h2", "kit-Story-title", story.title), variants);
  return section;
}

function renderNavigation(): HTMLElement {
  const navigation = createElement("nav", "kit-Nav");

  navigation.ariaLabel = "Stories";
  navigation.append(...STORIES.map(({ id, story }) => {
    const link = createElement("a", "kit-Nav-link", story.title);

    link.href = `#${id}`;
    return link;
  }));
  return navigation;
}

function showSelectedStory(navigation: HTMLElement, main: HTMLElement, log: (message: string) => void): void {
  const selected = STORIES.find(({ id }) => `#${id}` === location.hash) ?? STORIES[0];

  for (const link of navigation.querySelectorAll("a")) {
    link.ariaCurrent = link.hash === `#${selected.id}` ? "page" : null;
  }
  main.replaceChildren(renderStory(selected.story, log));
}

const FONTS: readonly AppFont[] = [SYSTEM_FONT, VERDANA_FONT, INSTRUMENT_FONT, INTER_FONT, GEIST_FONT, PLEX_FONT];

function renderSchemeToggle(app: HTMLElement): HTMLElement {
  const item = createElement("label", "kit-Toolbar-item", "Dark");
  const dark = new Signal(matchMedia("(prefers-color-scheme: dark)").matches);
  const { result: scheme } = render(document, () => h(Switch, {
    value: dark,
    onValueChange: next => {
      app.style.colorScheme = next ? "dark" : "light";
      dark.value = next;
    }
  }));

  item.append(scheme);
  return item;
}

function renderFontPicker(app: HTMLElement): HTMLElement {
  const item = createElement("div", "kit-Toolbar-item", "Font");
  const name = new Signal<string>(FONTS[0].name);
  const { result: font } = render(document, () => h(Segmented<string>, {
    choices: FONTS.map(choice => ({ value: choice.name, label: choice.name })),
    size: "small",
    value: name,
    onValueChange: next => {
      installAppFont(app, FONTS.find(choice => choice.name === next) ?? SYSTEM_FONT);
      name.value = next;
    }
  }));

  font.setAttribute("aria-label", "Font");
  item.append(font);
  return item;
}

function renderToolbar(app: HTMLElement): HTMLElement {
  const toolbar = createElement("div", "kit-Toolbar");

  toolbar.append(renderSchemeToggle(app), renderFontPicker(app));
  return toolbar;
}

function main(): void {
  const shadowRoot = new BrowserHostPage().claimContent().attachShadow({ mode: "open" });
  const app = createElement("div", "fsg-App kit-Page");
  const navigation = renderNavigation();
  const stories = createElement("main", "");
  const logOutput = createElement("output", "kit-Log", "Events appear here.\n");
  const log = (message: string): void => {
    logOutput.textContent += `${message}\n`;
    logOutput.scrollTop = logOutput.scrollHeight;
  };

  applyTheme(app, THEME_DEFINITIONS[DEFAULT_THEME]);
  shadowRoot.adoptedStyleSheets = [createStyleSheet(UI_CSS), createStyleSheet(KIT_CSS)];
  window.addEventListener("hashchange", () => showSelectedStory(navigation, stories, log));
  showSelectedStory(navigation, stories, log);
  app.append(renderToolbar(app), navigation, stories, logOutput);
  shadowRoot.append(app);
}

main();
