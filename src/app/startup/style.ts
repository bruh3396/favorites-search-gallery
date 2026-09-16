import { applyTheme, toggleGradient } from "@/lib/ui/theme/apply";
import { toggleNativeFont, toggleThemedGalleryBackground } from "@/lib/ui/toggles";
import ANIMATIONS_CSS from "@/assets/css/base/animations.css";
import { AppContext } from "@/app/context/context";
import BADGE_CSS from "@/assets/css/base/badge.css";
import CONTROLS_CSS from "@/assets/css/base/controls.css";
import ELEMENTS_CSS from "@/assets/css/base/elements.css";
import FONT_CSS from "@/assets/css/base/font.css";
import MOBILE_CSS from "@/assets/css/base/mobile.css";
import POST_ACTION_BAR_CSS from "@/assets/css/base/post_action_bar.css";
import POST_CSS from "@/assets/css/base/post.css";
import SKELETON_CSS from "@/assets/css/favorites/skeleton.css";
import THEMES_CSS from "@/assets/css/base/themes.css";
import THUMB_LOADING_CSS from "@/assets/css/base/loading.css";
import TILE_CSS from "@/assets/css/base/tile.css";
import TOOLTIP_CSS from "@/assets/css/base/tooltip.css";
import { ThumbConfig } from "@/config/thumb_config";
import UTILITIES_CSS from "@/assets/css/base/utilities.css";
import VARIABLES_CSS from "@/assets/css/base/variables.css";
import WIDGETS_CSS from "@/assets/css/base/widgets.css";
import { insertStyle } from "@/utils/browser/injector";
import { setTooltipsEnabled } from "@/lib/ui/tooltip/tooltip";
import { themeStyles } from "@/lib/ui/theme/builder";

export function setupStyles(context: AppContext): void {
  insertBaseStyles(context);
  applyPreferenceStyles(context);
  applyTileVariables(context);
}

function applyPreferenceStyles(context: AppContext): void {
  const { preferences } = context;

  applyTheme(preferences.app.theme.value, preferences.app.darkMode.value);
  toggleGradient(preferences.app.gradient.value);
  setTooltipsEnabled(preferences.favorites.hintsEnabled.value);
  toggleNativeFont(preferences.app.nativeFont.value);
  toggleThemedGalleryBackground(preferences.gallery.themedBackground.value);
}

function insertBaseStyles(context: AppContext): void {
  const fadeInCss = context.preferences.app.fadeThumbs.value ? ANIMATIONS_CSS : "";
  const mobileCss = context.environment.onMobileDevice ? MOBILE_CSS + CONTROLS_CSS : "";

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
    TOOLTIP_CSS +
    THEMES_CSS +
    themeStyles() +
    THUMB_LOADING_CSS +
    mobileCss +
    fadeInCss);
}

function applyTileVariables(context: AppContext): void {
  const { content } = context.shell;
  const outlineSize = context.environment.onMobileDevice ? 1 : 2;
  const rightMargin = context.environment.onDesktopDevice ? ThumbConfig.rightContentMargin : 0;
  const tileGap = context.environment.onPostListPage ? ThumbConfig.spacing.postList : ThumbConfig.spacing.favorites;

  content.style.setProperty("--media-outline-size", `${outlineSize}px`);
  content.style.setProperty("--tile-gap", `${tileGap}px`);
  content.style.setProperty("--content-right-margin", `${rightMargin}px`);
}
