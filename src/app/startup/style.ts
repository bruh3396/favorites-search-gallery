import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { applySurfaceGradient, applyTheme } from "@/lib/ui/theme";
import ANIMATIONS_CSS from "@/assets/css/base/animations.css";
import { Content } from "@/app/layout/shell";
import ELEMENTS_CSS from "@/assets/css/base/elements.css";
import HIGHLIGHT_CSS from "@/assets/css/base/highlight.css";
import POST_CSS from "@/assets/css/base/post.css";
import { Preferences } from "@/app/context/preferences";
import SKELETON_CSS from "@/assets/css/favorites/skeleton.css";
import THEMES_CSS from "@/assets/css/base/themes.css";
import THUMB_LOADING_CSS from "@/assets/css/base/loading.css";
import TILE_CSS from "@/assets/css/base/tile.css";
import { ThumbConfig } from "@/config/thumb_config";
import UTILITIES_CSS from "@/assets/css/base/utilities.css";
import VARIABLES_CSS from "@/assets/css/base/variables.css";
import WIDGETS_CSS from "@/assets/css/base/widgets.css";
import { insertStyle } from "@/utils/dom/injector";

export function setupStyles(): void {
  insertBaseStyles();
  applyTheme(Preferences.appTheme.value);
  applySurfaceGradient(Preferences.appSurfaceGradient.value);
  applyTileVariables();
}

function insertBaseStyles(): void {
  const fadeInCss = ThumbConfig.fadeIn ? ANIMATIONS_CSS : "";

  insertStyle(VARIABLES_CSS +
    ELEMENTS_CSS +
    UTILITIES_CSS +
    WIDGETS_CSS +
    SKELETON_CSS +
    POST_CSS +
    TILE_CSS +
    HIGHLIGHT_CSS +
    THEMES_CSS +
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
