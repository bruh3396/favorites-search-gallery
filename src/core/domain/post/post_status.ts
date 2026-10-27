export const POST_STATUSES = ["active", "deleted", "purged"] as const;

export type PostStatus = typeof POST_STATUSES[number];
