export function readQueryParam(url: string, name: string): string | null {
  return new URL(url).searchParams.get(name);
}

export function withHostname(url: string, hostname: string): string {
  const parsed = new URL(url);

  parsed.hostname = hostname;
  return parsed.toString();
}

export function withoutQueryParam(url: string, name: string): string {
  const parsed = new URL(url);

  parsed.searchParams.delete(name);
  return parsed.toString();
}

export function withNoQueryParams(url: string): string {
  const parsed = new URL(url);

  parsed.search = "";
  return parsed.toString();
}
