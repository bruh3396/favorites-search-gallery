export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readString(value: unknown, key: string, fallback: string = ""): string {
  const field = isRecord(value) ? value[key] : undefined;
  return typeof field === "string" ? field : fallback;
}
