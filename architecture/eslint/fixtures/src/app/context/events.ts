export const value = 1;

export type Events = ReturnType<typeof createEvents>;

export function createEvents(): { favoriteAdded: string[] } {
  return { favoriteAdded: [] };
}
