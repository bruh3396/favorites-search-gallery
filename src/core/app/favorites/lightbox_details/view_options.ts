export const TAG_ORGANIZATIONS = ["category", "list"] as const;
export const TAG_ALIGNMENTS = ["start", "center"] as const;
export const TAG_SIZES = ["small", "medium", "large"] as const;

export type TagOrganization = typeof TAG_ORGANIZATIONS[number];
export type TagAlignment = typeof TAG_ALIGNMENTS[number];
export type TagSize = typeof TAG_SIZES[number];
