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
  let cookieString = `${key}=${value || ""}`;
  const expirationDate = new Date();

  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  cookieString += `; expires=${expirationDate.toUTCString()}`;
  cookieString += "; path=/";
  document.cookie = cookieString;
}

export function getUserId(): string {
  return getCookie("user_id", "");
}

export function getFavoritesPageId(): string | null {
  const match = (/(?:&|\?)id=(\d+)/).exec(window.location.href);
  return match ? match[1] : null;
}

export function isUserIsOnTheirOwnFavoritesPage(): boolean {
  return getUserId() === getFavoritesPageId();
}
