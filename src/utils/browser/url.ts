export function getQueryParam(name: string): string | null {
  const match = new RegExp(`(?:&|\\?)${name}=([^&]+)`).exec(window.location.href);
  return match ? match[1] : null;
}
