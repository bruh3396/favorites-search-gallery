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
