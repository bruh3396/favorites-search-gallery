export function readCookie(key: string, defaultValue: string = ""): string {
  const equation = `${key}=`;
  const cookies = document.cookie.split(";").map(cookie => cookie.trimStart());

  for (const cookie of cookies) {
    if (cookie.startsWith(equation)) {
      return cookie.substring(equation.length, cookie.length);
    }
  }
  return defaultValue;
}

export function writeCookie(key: string, value: string): void {
  let cookieString = `${key}=${value ?? ""}`;
  const expirationDate = new Date();

  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  cookieString += `; expires=${expirationDate.toUTCString()}`;
  cookieString += "; path=/";
  document.cookie = cookieString;
}
