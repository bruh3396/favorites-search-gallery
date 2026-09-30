import { actionBarIconStyles, setActionBarButtons, setActionBarMode } from "@/lib/ui/thumb/action_bar";
import { applyTheme, toggleGradient } from "@/lib/ui/theme/apply";
import { toggleNativeFont, toggleThemedGalleryBackground } from "@/lib/ui/toggles";
import ANIMATIONS_CSS from "@/assets/css/base/animations.css";
import AUTOPLAY_CSS from "@/assets/css/gallery/autoplay.css";
import { AppContext } from "@/app/context/context";
import BADGE_CSS from "@/assets/css/base/badge.css";
import CHANGELOG_CSS from "@/assets/css/favorites/changelog.css";
import DESKTOP_CSS from "@/assets/css/base/desktop.css";
import DRAWER_CSS from "@/assets/css/favorites/drawer.css";
import DRAWER_SECTIONS_CSS from "@/assets/css/favorites/drawer_sections.css";
import ELEMENTS_CSS from "@/assets/css/base/elements.css";
import FONT_CSS from "@/assets/css/base/font.css";
import GALLERY_CSS from "@/assets/css/gallery/gallery.css";
import HELP_CSS from "@/assets/css/favorites/help.css";
import MOBILE_CSS from "@/assets/css/base/mobile.css";
import PAGINATION_CSS from "@/assets/css/favorites/pagination.css";
import POST_ACTION_BAR_CSS from "@/assets/css/base/post_action_bar.css";
import POST_CSS from "@/assets/css/base/post.css";
import POST_LIST_CSS from "@/assets/css/post_list/post_list.css";
import POST_OVERLAY_CSS from "@/assets/css/post_overlay.css";
import { Preferences } from "@/app/context/preferences";
import SEARCH_FIELD_CSS from "@/assets/css/favorites/search_field.css";
import SETTINGS_CSS from "@/assets/css/favorites/settings.css";
import SKELETON_CSS from "@/assets/css/favorites/skeleton.css";
import SNIPPETS_CSS from "@/assets/css/favorites/snippets.css";
import THEMES_CSS from "@/assets/css/base/themes.css";
import THUMB_LOADING_CSS from "@/assets/css/base/loading.css";
import TILE_CSS from "@/assets/css/base/tile.css";
import TOOLBAR_CSS from "@/assets/css/favorites/toolbar.css";
import TOOLTIP_CSS from "@/assets/css/tooltip.css";
import TOOLTIP_HINT_CSS from "@/assets/css/base/tooltip_hint.css";
import TUTORIAL_CSS from "@/assets/css/gallery/tutorial.css";
import { ThumbConfig } from "@/config/thumb_config";
import UTILITIES_CSS from "@/assets/css/base/utilities.css";
import VARIABLES_CSS from "@/assets/css/base/variables.css";
import WIDGETS_CSS from "@/assets/css/base/widgets.css";
import { setTooltipsEnabled } from "@/lib/ui/tooltip/tooltip";
import { themeStyles } from "@/lib/ui/theme/builder";

export function setupStyles(context: AppContext): void {
  insertBaseStyles(context);
  applyPreferenceStyles(context);
  subscribeToPreferenceStyles(context);
  applyTileVariables(context);
}

function applyPreferenceStyles(context: AppContext): void {
  const { preferences } = context;
  const actionBar = actionBarPreferences(context);

  applyCurrentTheme(context);
  toggleGradient(preferences.app.gradient.value);
  setTooltipsEnabled(preferences.favorites.hintsEnabled.value);
  toggleNativeFont(preferences.app.nativeFont.value);
  toggleThemedGalleryBackground(preferences.gallery.themedBackground.value);
  setActionBarMode(actionBar.postActionBar.value);
  setActionBarButtons(actionBar.postActionBarButtons.value);
}

function subscribeToPreferenceStyles(context: AppContext): void {
  const { preferences, ports } = context;
  const actionBar = actionBarPreferences(context);

  preferences.app.theme.on(() => applyCurrentTheme(context));
  preferences.app.colorScheme.on((colorScheme) => {
    applyCurrentTheme(context);
    ports.hostPage.setColorScheme(colorScheme);
  });
  preferences.app.gradient.on(toggleGradient);
  preferences.app.nativeFont.on(toggleNativeFont);
  preferences.gallery.themedBackground.on(toggleThemedGalleryBackground);
  actionBar.postActionBar.on(setActionBarMode);
  actionBar.postActionBarButtons.on(setActionBarButtons);
}

function applyCurrentTheme({ preferences }: AppContext): void {
  applyTheme(preferences.app.theme.value, preferences.app.colorScheme.value);
}

function actionBarPreferences({ preferences, environment }: AppContext): Preferences["favorites"] | Preferences["postList"] {
  return environment.mode === "postList" ? preferences.postList : preferences.favorites;
}

function insertBaseStyles(context: AppContext): void {
  const fadeInCss = context.preferences.app.fadeThumbs.value ? ANIMATIONS_CSS : "";
  const platformCss = context.environment.device === "mobile" ? MOBILE_CSS + TUTORIAL_CSS : DESKTOP_CSS;
  const galleryCss = context.features.has("gallery") ? GALLERY_CSS + AUTOPLAY_CSS : "";
  const tooltipCss = context.features.has("tooltip") ? TOOLTIP_CSS + TOOLTIP_HINT_CSS : "";
  const postListCss = context.environment.mode === "postList" ? POST_LIST_CSS + SETTINGS_CSS : "";
  const postOverlayCss = context.features.has("postOverlay") ? POST_OVERLAY_CSS : "";
  const favoritesCss = context.environment.mode === "favorites" ? TOOLBAR_CSS + SEARCH_FIELD_CSS + PAGINATION_CSS + DRAWER_CSS + DRAWER_SECTIONS_CSS + SETTINGS_CSS + SNIPPETS_CSS + HELP_CSS + CHANGELOG_CSS : "";

  insertStyle(VARIABLES_CSS +
    ELEMENTS_CSS +
    FONT_CSS +
    WIDGETS_CSS +
    UTILITIES_CSS +
    SKELETON_CSS +
    POST_CSS +
    POST_ACTION_BAR_CSS +
    TILE_CSS +
    BADGE_CSS +
    tooltipCss +
    THEMES_CSS +
    themeStyles() +
    actionBarIconStyles() +
    THUMB_LOADING_CSS +
    platformCss +
    galleryCss +
    postListCss +
    fadeInCss +
    favoritesCss +
    postOverlayCss);
}

function insertStyle(css: string): void {
  const style = document.createElement("style");

  style.textContent = css;
  document.head.appendChild(style);
}

function applyTileVariables(context: AppContext): void {
  const { content } = context.shell;
  const outlineSize = context.environment.device === "mobile" ? 1 : 2;
  const rightMargin = context.environment.device === "desktop" ? ThumbConfig.rightContentMargin : 0;
  const tileGap = context.environment.mode === "postList" ? ThumbConfig.spacing.postList : ThumbConfig.spacing.favorites;

  content.style.setProperty("--media-outline-size", `${outlineSize}px`);
  content.style.setProperty("--tile-gap", `${tileGap}px`);
  content.style.setProperty("--content-right-margin", `${rightMargin}px`);
}
