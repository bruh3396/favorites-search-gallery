export function copyText(text: string): void {
  navigator.clipboard.writeText(text).catch(() => { });
}
