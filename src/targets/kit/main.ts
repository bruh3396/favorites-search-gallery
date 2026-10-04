import { Story, StoryVariant } from "@/targets/kit/story";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { DISCLOSURE_STORY } from "@/targets/kit/stories/disclosure";
import { DROPDOWN_STORY } from "@/targets/kit/stories/dropdown";
import KIT_CSS from "@/targets/kit/kit.css?inline";
import { MULTI_SELECT_STORY } from "@/targets/kit/stories/multi_select";
import { SEGMENTED_STORY } from "@/targets/kit/stories/segmented";
import { SETTINGS_SCREEN_STORY } from "@/targets/kit/stories/settings_screen";
import { SETTING_ROW_STORY } from "@/targets/kit/stories/setting_row";
import { SETTING_STORY } from "@/targets/kit/stories/setting";
import { STEPPER_STORY } from "@/targets/kit/stories/stepper";
import { SWITCH_STORY } from "@/targets/kit/stories/switch";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createSegmented } from "@/core/ui/components/segmented/segmented";
import { createSwitch } from "@/core/ui/components/switch/switch";

const STORIES: Story[] = [
  SWITCH_STORY, SEGMENTED_STORY, MULTI_SELECT_STORY, STEPPER_STORY, DROPDOWN_STORY, DISCLOSURE_STORY,
  SETTING_ROW_STORY, SETTING_STORY, SETTINGS_SCREEN_STORY
];

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

const FONTS = [
  { value: "system-ui, sans-serif", label: "System" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "ui-monospace, monospace", label: "Mono" }
] as const;

function renderSchemeToggle(app: HTMLElement): HTMLElement {
  const item = createElement("label", "kit-Toolbar-item", "Dark");
  const scheme = createSwitch(document, {
    onValueChange: dark => {
      app.style.colorScheme = dark ? "dark" : "light";
      scheme.setValue(dark);
    }
  });

  scheme.setValue(matchMedia("(prefers-color-scheme: dark)").matches);
  item.append(scheme.element);
  return item;
}

function renderFontPicker(app: HTMLElement): HTMLElement {
  const item = createElement("div", "kit-Toolbar-item", "Font");
  const font = createSegmented<string>(document, {
    options: FONTS,
    size: "small",
    onValueChange: family => {
      app.style.setProperty("--fsg-font-family", family);
      font.setValue(family);
    }
  });

  font.element.setAttribute("aria-label", "Font");
  font.setValue(FONTS[0].value);
  item.append(font.element);
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
  const stories = createElement("main", "");
  const logOutput = createElement("output", "kit-Log", "Events appear here.\n");
  const log = (message: string): void => {
    logOutput.textContent += `${message}\n`;
    logOutput.scrollTop = logOutput.scrollHeight;
  };

  shadowRoot.adoptedStyleSheets = [createStyleSheet(UI_CSS), createStyleSheet(KIT_CSS)];
  stories.append(...STORIES.map(story => renderStory(story, log)));
  app.append(renderToolbar(app), stories, logOutput);
  shadowRoot.append(app);
}

main();
