import { Post } from "@/types/api";
import { thumbToPost } from "@/lib/remote/parsers/thumb_parser";

export function removeOriginalUnusedScripts(): void {
  for (const script of document.querySelectorAll("script")) {
    if ((/(?:fluidplayer|awesomplete)/).test(script.src)) {
      script.remove();
    }
  }
  releaseUnusedGlobals();
}

export function takeNativeFavorites(): Post[] | undefined {
  const content = document.querySelector<HTMLElement>("#content, div:has(.thumb)");

  if (content === null) {
    return undefined;
  }
  const thumbs = Array.from(content.querySelectorAll<HTMLElement>(".thumb"));
  const posts = thumbs.map(thumbToPost);

  purgeNativeContent(content);
  return posts.length === 0 ? undefined : posts;
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

function releaseUnusedGlobals(): void {
  const unused = [
    "fluidPlayer", "webpackChunkfluid_player", "Awesomplete", "dashjs",
    "Post",
    "getCaptcha", "loadCaptchaScript",
    "captchaInstance", "captchaInstanceFormKey", "captchaSiteKey",
    "captchaProvider", "captchaScriptLoaded", "captchaRenderIdFn",
    "captchaResponseFormKey", "captchaCSSClass"
  ];

  for (const global of unused) {
    try {
      delete (window as unknown as Record<string, unknown>)[global];
    } catch (error) {
      console.error(error);
    }
  }
}
