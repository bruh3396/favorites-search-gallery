export const localPosts = 1;

export interface LocalPosts {
  getMany: (ids: string[]) => Promise<string[]>;
}
