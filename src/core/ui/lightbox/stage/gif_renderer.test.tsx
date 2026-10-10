import { GifRenderer, GifRendererDependencies } from "@/core/ui/lightbox/stage/gif_renderer";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { LightboxStageClass } from "@/core/ui/lightbox/stage/stage_class";
import { MediaItem } from "@/core/domain/post/post";
import { render } from "@/core/ui/h/h";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1.gif" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2.gif" } };

interface Setup {
  renderer: GifRenderer;
  image: HTMLImageElement;
  resolveOriginalUrl: Mock<GifRendererDependencies["resolveOriginalUrl"]>;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

function setup(resolve: GifRendererDependencies["resolveOriginalUrl"] = media => Promise.resolve(`https://original/${media.locator}`)): Setup {
  const resolveOriginalUrl = vi.fn(resolve);
  const { result: renderer } = render(document, () => new GifRenderer({ resolveOriginalUrl }));
  const image = renderer.root.querySelector<HTMLImageElement>("img")!;
  return { renderer, image, resolveOriginalUrl };
}

describe("GifRenderer", () => {
  test("starts hidden with an async image in the stage root", () => {
    const { renderer, image } = setup();

    expect(renderer.root.className).toBe(LightboxStageClass.renderer);
    expect(image.className).toBe(LightboxStageClass.media);
    expect([image.alt, image.decoding]).toEqual(["", "async"]);
    expect([renderer.root.hidden, image.hidden, image.hasAttribute("src")]).toEqual([true, true, false]);
  });

  test("shows the image while its URL loads and then assigns the resolved URL", async() => {
    const pending = deferred<string>();
    const { renderer, image, resolveOriginalUrl } = setup(() => pending.promise);

    renderer.show(FIRST);
    expect([renderer.root.hidden, image.hidden, image.hasAttribute("src")]).toEqual([false, false, false]);
    await vi.waitFor(() => expect(resolveOriginalUrl).toHaveBeenCalledWith(FIRST.media));
    pending.resolve("https://original/first.gif");
    await vi.waitFor(() => expect(image.getAttribute("src")).toBe("https://original/first.gif"));
  });

  test("does not replace the current URL with a stale result", async() => {
    const pending = deferred<string>();
    const { renderer, image } = setup(media => (
      media.locator === FIRST.media.locator ? pending.promise : Promise.resolve("https://original/second.gif")
    ));

    renderer.show(FIRST);
    await Promise.resolve();
    renderer.show(SECOND);
    await vi.waitFor(() => expect(image.getAttribute("src")).toBe("https://original/second.gif"));
    pending.resolve("https://original/stale.gif");
    await Promise.resolve();
    expect(image.getAttribute("src")).toBe("https://original/second.gif");
  });

  test("does not assign an image source that is already current", async() => {
    const pending = deferred<string>();
    const { renderer, image, resolveOriginalUrl } = setup(() => pending.promise);

    renderer.show(FIRST);
    await vi.waitFor(() => expect(resolveOriginalUrl).toHaveBeenCalledOnce());
    image.src = "https://original/shared.gif";
    const assignSource = vi.spyOn(image, "src", "set");

    pending.resolve("https://original/shared.gif");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(assignSource).not.toHaveBeenCalled();
    expect(image.getAttribute("src")).toBe("https://original/shared.gif");
  });

  test("logs a failed URL lookup and leaves the image visible without a source", async() => {
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { renderer, image } = setup(() => Promise.reject(error));

    onTestFinished(() => log.mockRestore());
    renderer.show(FIRST);
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(error));
    expect([renderer.root.hidden, image.hidden, image.hasAttribute("src")]).toEqual([false, false, false]);
  });

  test("clears the image and ignores a URL that resolves afterward", async() => {
    const pending = deferred<string>();
    const { renderer, image } = setup(() => pending.promise);

    renderer.show(FIRST);
    await Promise.resolve();
    renderer.clear();
    pending.resolve("https://original/late.gif");
    await Promise.resolve();
    expect([renderer.root.hidden, image.hidden, image.hasAttribute("src")]).toEqual([true, true, false]);
  });

  test("ignores neighbors and stops rendering when disposed", async() => {
    const { renderer, image, resolveOriginalUrl } = setup();

    renderer.setNeighbors();
    await Promise.resolve();
    expect(resolveOriginalUrl).not.toHaveBeenCalled();
    renderer.show(FIRST);
    await vi.waitFor(() => expect(image.hasAttribute("src")).toBe(true));
    renderer.dispose();
    expect([renderer.root.hidden, image.hidden, image.hasAttribute("src")]).toEqual([true, true, false]);
  });
});
