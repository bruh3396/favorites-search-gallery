export function build(ids: string[]): string {
  return ids.length === 0 ? "" : `( ${ids.join(" ~ ")} )`;
}
