export const TAG_ALIGNMENTS = ["start", "center"] as const;

export type TagAlignment = typeof TAG_ALIGNMENTS[number];
