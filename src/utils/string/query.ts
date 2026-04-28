export function isOnlyDigits(text: string): boolean {
  return (/^\d+$/).test(text);
}

export function isEmptyString(text: string): boolean {
  return text.trim().length === 0;
}
