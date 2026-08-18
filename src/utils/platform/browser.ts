import { getQueryParamFromUrl } from "@/utils/pure/url";

export function getCookie(key: string, defaultValue: string): string {
  const nameEquation = `${key}=`;
  const cookies = document.cookie.split(";").map(cookie => cookie.trimStart());

  for (const cookie of cookies) {
    if (cookie.startsWith(nameEquation)) {
      return cookie.substring(nameEquation.length, cookie.length);
    }
  }
  return defaultValue;
}

export function setCookie(key: string, value: string): void {
  let cookieString = `${key}=${value ?? ""}`;
  const expirationDate = new Date();

  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  cookieString += `; expires=${expirationDate.toUTCString()}`;
  cookieString += "; path=/";
  document.cookie = cookieString;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export async function download(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();

  downloadBlob(blob, filename);
}

export function selectFile(accept: string, onSelected: (contents: string) => void): void {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = accept;
  input.addEventListener("change", () => {
    const file = input.files?.[0];

    if (file !== undefined) {
      file.text().then(onSelected);
    }
  });
  input.click();
}

export function copyText(text: string): void {
  navigator.clipboard.writeText(text).catch(() => { });
}

export function getQueryParam(name: string): string | null {
  return getQueryParamFromUrl(window.location.href, name);
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement === null) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

export function reloadWindow(): void {
  window.location.reload();
}

export function createWorker(script: string): Worker {
  const blob = new Blob([script], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}
