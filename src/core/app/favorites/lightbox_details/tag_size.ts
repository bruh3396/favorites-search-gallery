export const TAG_SIZES = ["small", "medium", "large"] as const;

export type TagSize = typeof TAG_SIZES[number];
