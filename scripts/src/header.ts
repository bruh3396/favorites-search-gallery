export function buildHeader(scriptVersion: string): string {
  return `// ==UserScript==
// @name         Rule34 Favorites Search Gallery
// @namespace    bruh3396
// @version      ${scriptVersion}
// @description  Search, View, and Play Rule34 Favorites (Desktop/Android/iOS)
// @author       bruh3396
// @compatible   Chrome
// @compatible   Edge
// @compatible   Firefox
// @compatible   Safari
// @compatible   Opera
// @match        https://rule34.xxx/index.php?page=favorites&s=view&id=*
// @match        https://rule34.xxx/index.php?page=post&s=list*
// @grant        none

// ==/UserScript==`;
}
