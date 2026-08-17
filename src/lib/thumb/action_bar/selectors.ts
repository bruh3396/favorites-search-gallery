export const ActionBarSelectors = {
  bar: "post-action-bar",
  button: "post-action-button",
  heartEmpty: "post-action-heart-empty",
  heartFilled: "post-action-heart-filled"
} as const;

export const ActionBarDataset = {
  enabled: "postActionBarEnabled",
  static: "postActionBarStatic",
  isFavorite: "isFavorite"
} as const;
