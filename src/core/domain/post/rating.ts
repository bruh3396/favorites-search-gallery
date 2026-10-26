export const RATINGS = ["explicit", "questionable", "safe"] as const;

export type Rating = typeof RATINGS[number];
