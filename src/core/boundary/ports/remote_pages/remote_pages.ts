export interface RemotePages {
  postUrl: (postId: string) => string;
  searchUrl: (query: string) => string;
  postExists: (postId: string) => Promise<boolean>;
}
