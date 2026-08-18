export const ActionBarSelectors = {
  bar: "post-action-bar",
  button: "post-action-button",
  id: "post-action-id",
  heartEmpty: "post-action-heart-empty",
  heartFilled: "post-action-heart-filled"
} as const;

export const ActionBarDataset = {
  mode: "postActionBarMode",
  style: "postActionBarStyle",
  favoriteVisible: "postActionBarFavoriteVisible",
  downloadVisible: "postActionBarDownloadVisible",
  isFavorite: "isFavorite"
} as const;
