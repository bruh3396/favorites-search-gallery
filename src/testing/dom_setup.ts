if (!("FontFace" in globalThis)) {
  Object.defineProperty(globalThis, "FontFace", { value: class { }, configurable: true, writable: true });
}

if (!("fonts" in document)) {
  Object.defineProperty(document, "fonts", { value: new Set(), configurable: true });
}
