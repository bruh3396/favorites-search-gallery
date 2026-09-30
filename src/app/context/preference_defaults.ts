import { ActionBarButton, ActionBarMode } from "@/lib/ui/thumb/action_bar";
import { ColorScheme, Environment, Pointer } from "@/core/boundary/environment";

interface PointerDefaults {
  favoritesColumnCount: number;
  favoritesHintsEnabled: boolean;
  favoritesInfiniteScroll: boolean;
  favoritesPostActionBar: ActionBarMode;
  favoritesPostActionBarButtons: ActionBarButton;
  galleryMenuDockedLeft: boolean;
  galleryMenuEnabled: boolean;
  galleryMenuPinned: boolean;
  postListColumnCount: number;
  postListPostActionBar: ActionBarMode;
  postListUpscaleThumbs: boolean;
}

interface HostDefaults {
  colorScheme: ColorScheme;
}

export type PreferenceDefaults = PointerDefaults & HostDefaults;

const BY_POINTER: Record<Pointer, PointerDefaults> = {
  hover: {
    favoritesColumnCount: 5,
    favoritesHintsEnabled: true,
    favoritesInfiniteScroll: false,
    favoritesPostActionBar: "hover",
    favoritesPostActionBarButtons: ActionBarButton.Favorite,
    galleryMenuDockedLeft: true,
    galleryMenuEnabled: false,
    galleryMenuPinned: false,
    postListColumnCount: 5,
    postListPostActionBar: "hover",
    postListUpscaleThumbs: true
  },
  touch: {
    favoritesColumnCount: 2,
    favoritesHintsEnabled: false,
    favoritesInfiniteScroll: true,
    favoritesPostActionBar: "off",
    favoritesPostActionBarButtons: ActionBarButton.Favorite | ActionBarButton.Open,
    galleryMenuDockedLeft: false,
    galleryMenuEnabled: true,
    galleryMenuPinned: true,
    postListColumnCount: 2,
    postListPostActionBar: "always",
    postListUpscaleThumbs: false
  }
};

export function selectPreferenceDefaults(environment: Environment): PreferenceDefaults {
  return {
    ...BY_POINTER[environment.pointer],
    colorScheme: environment.colorScheme
  };
}
