import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { applyTheme, toggleGradient } from "@/lib/ui/theme/apply";
import ANIMATIONS_CSS from "@/assets/css/base/animations.css";
import { Content } from "@/app/layout/shell";
import ELEMENTS_CSS from "@/assets/css/base/elements.css";
import FONT_CSS from "@/assets/css/base/font.css";
import { GeneralConfig } from "@/config/general_config";
import HIGHLIGHT_CSS from "@/assets/css/base/highlight.css";
import MOBILE_CSS from "@/assets/css/base/mobile.css";
import POST_CSS from "@/assets/css/base/post.css";
import { Preferences } from "@/app/context/preferences";
import SKELETON_CSS from "@/assets/css/favorites/skeleton.css";
import THEMES_CSS from "@/assets/css/base/themes.css";
import THUMB_LOADING_CSS from "@/assets/css/base/loading.css";
import TILE_CSS from "@/assets/css/base/tile.css";
import TOOLTIP_CSS from "@/assets/css/base/tooltip.css";
import { ThumbConfig } from "@/config/thumb_config";
import UTILITIES_CSS from "@/assets/css/base/utilities.css";
import VARIABLES_CSS from "@/assets/css/base/variables.css";
import WIDGETS_CSS from "@/assets/css/base/widgets.css";
import { insertStyle } from "@/utils/dom/injector";
import { setTooltipsEnabled } from "@/lib/ui/tooltip/tooltip";
import { themeStyles } from "@/lib/ui/theme/builder";

export function setupStyles(): void {
  insertBaseStyles();
  applyTheme(Preferences.app.theme.value, Preferences.app.darkMode.value);
  toggleGradient(Preferences.app.gradient.value);
  setTooltipsEnabled(Preferences.favorites.hintsEnabled.value);
  applyTileVariables();
}

function insertBaseStyles(): void {
  const fadeInCss = Preferences.app.fadeThumbs.value ? ANIMATIONS_CSS : "";
  const fontCss = GeneralConfig.overrideSiteFont ? FONT_CSS : "";

  insertStyle(VARIABLES_CSS +
    ELEMENTS_CSS +
    fontCss +
    WIDGETS_CSS +
    UTILITIES_CSS +
    MOBILE_CSS +
    SKELETON_CSS +
    POST_CSS +
    TILE_CSS +
    HIGHLIGHT_CSS +
    TOOLTIP_CSS +
    THEMES_CSS +
    themeStyles() +
    THUMB_LOADING_CSS +
    fadeInCss);
}

function applyTileVariables(): void {
  const outlineSize = ON_MOBILE_DEVICE ? 1 : 2;
  const rightMargin = ON_DESKTOP_DEVICE ? ThumbConfig.rightContentMargin : 0;

  Content.style.setProperty("--media-outline-size", `${outlineSize}px`);
  Content.style.setProperty("--tile-gap", `${ThumbConfig.spacing}px`);
  Content.style.setProperty("--content-right-margin", `${rightMargin}px`);
}
