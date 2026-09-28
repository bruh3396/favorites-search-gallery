const NATIVE_CONTENT_SELECTOR = "#content, div:has(.thumb)";
const UNUSED_SCRIPT = /(?:fluidplayer|awesomplete)/;
const UNUSED_GLOBALS = [
  "fluidPlayer", "webpackChunkfluid_player", "Awesomplete", "dashjs",
  "Post",
  "getCaptcha", "loadCaptchaScript",
  "captchaInstance", "captchaInstanceFormKey", "captchaSiteKey",
  "captchaProvider", "captchaScriptLoaded", "captchaRenderIdFn",
  "captchaResponseFormKey", "captchaCSSClass"
];

export function clearNativePage(): void {
  removeNativeContent();
  removeUnusedScripts();
  releaseUnusedGlobals();
}

function removeNativeContent(): void {
  const content = document.querySelector<HTMLElement>(NATIVE_CONTENT_SELECTOR);

  if (content !== null) {
    purgeNativeContent(content);
  }
}

function purgeNativeContent(content: HTMLElement): void {
  for (const element of content.querySelectorAll("*")) {
    stripAttributes(element);
    element.remove();
  }
  stripAttributes(content);
  content.remove();
}

function stripAttributes(element: Element): void {
  for (const name of Array.from(element.getAttributeNames())) {
    element.removeAttribute(name);
  }
}

function removeUnusedScripts(): void {
  for (const script of document.querySelectorAll("script")) {
    if (UNUSED_SCRIPT.test(script.src)) {
      script.remove();
    }
  }
}

function releaseUnusedGlobals(): void {
  for (const global of UNUSED_GLOBALS) {
    try {
      delete (window as unknown as Record<string, unknown>)[global];
    } catch (error) {
      console.error(error);
    }
  }
}
