export interface RemotePages {
  postUrl: (id: string) => string;
  searchUrl: (query: string) => string;
}
