export function isUrl(value: string): boolean {
  const parsed = URL.parse(value);
  return parsed !== null && (parsed.protocol === "http:" || parsed.protocol === "https:");
}

export function readQueryParam(url: string, name: string): string | null {
  return new URL(url).searchParams.get(name);
}

export function hasQueryParams(url: string, params: Record<string, string>): boolean {
  const search = new URL(url).searchParams;
  return Object.entries(params).every(([name, value]) => search.get(name) === value);
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
