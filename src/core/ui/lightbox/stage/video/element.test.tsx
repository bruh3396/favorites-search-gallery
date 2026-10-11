import { Mock, MockInstance, describe, expect, onTestFinished, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { VideoElement } from "@/core/ui/lightbox/stage/video/element";
import { render } from "@/core/ui/h/h";

const FIRST: Media = { kind: "video", locator: "videos/first.mp4" };
const SECOND: Media = { kind: "video", locator: "videos/second.mp4" };
const FIRST_URL = "https://original/first.mp4";
const SECOND_URL = "https://original/second.mp4";

interface Setup {
  video: VideoElement;
  element: HTMLVideoElement;
  resolve: Mock<(media: Media) => Promise<string>>;
  play: MockInstance<HTMLMediaElement["play"]>;
  pause: MockInstance<HTMLMediaElement["pause"]>;
  load: MockInstance<HTMLMediaElement["load"]>;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup(resolveOriginalUrl: (media: Media) => Promise<string> = () => Promise.resolve(FIRST_URL)): Setup {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  const resolve = vi.fn(resolveOriginalUrl);
  const { result: video } = render(document, () => new VideoElement(resolve));
  const element = Reflect.get(video, "element") as HTMLVideoElement;

  onTestFinished(() => {
    vi.restoreAllMocks();
  });
  return { video, element, resolve, play, pause, load };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("VideoElement", () => {
  test("creates a controlled video in the provided document", () => {
    const other = document.implementation.createHTMLDocument();
    const { result: video } = render(other, () => new VideoElement(() => Promise.resolve(FIRST_URL)));
    const element = Reflect.get(video, "element") as HTMLVideoElement;

    expect([element.ownerDocument, element.controls, element.hasAttribute("src")]).toEqual([other, true, false]);
  });

  test("plays a paused video and pauses a playing one when clicked", () => {
    const { element, play, pause } = setup();
    const paused = vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockReturnValue(true);
    const click = new MouseEvent("click", { cancelable: true });

    element.dispatchEvent(click);
    paused.mockReturnValue(false);
    element.dispatchEvent(new MouseEvent("click"));

    expect(click.defaultPrevented).toBe(true);
    expect([play.mock.calls.length, pause.mock.calls.length]).toEqual([1, 1]);
  });

  test("leaves a ctrl-click to the browser", () => {
    const { element, play, pause } = setup();
    const click = new MouseEvent("click", { cancelable: true, ctrlKey: true });

    element.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect([play.mock.calls.length, pause.mock.calls.length]).toEqual([0, 0]);
  });

  test("assigns a resolved URL without playing an inactive video", async() => {
    const { video, element, resolve, play } = setup();

    video.assign(FIRST);
    await flushPromises();

    expect(resolve).toHaveBeenCalledExactlyOnceWith(FIRST);
    expect(element.getAttribute("src")).toBe(FIRST_URL);
    expect(play).not.toHaveBeenCalled();
  });

  test("plays when an active video's URL resolves", async() => {
    const pending = deferred<string>();
    const { video, element, play } = setup(() => pending.promise);

    video.assign(FIRST);
    video.activate();
    expect(play).not.toHaveBeenCalled();

    pending.resolve(FIRST_URL);
    await flushPromises();
    expect(element.getAttribute("src")).toBe(FIRST_URL);
    expect(play).toHaveBeenCalledOnce();
  });

  test("plays immediately when an assigned video becomes active", async() => {
    const { video, play } = setup();

    video.assign(FIRST);
    await flushPromises();
    video.activate();

    expect(play).toHaveBeenCalledOnce();
  });

  test("pauses on deactivation and does not play a URL that arrives later", async() => {
    const pending = deferred<string>();
    const { video, element, play, pause } = setup(() => pending.promise);

    video.assign(FIRST);
    video.activate();
    video.deactivate();
    pending.resolve(FIRST_URL);
    await flushPromises();

    expect(pause).toHaveBeenCalledOnce();
    expect(element.getAttribute("src")).toBe(FIRST_URL);
    expect(play).not.toHaveBeenCalled();
  });

  test("releases an unresolved video and ignores its late URL", async() => {
    const pending = deferred<string>();
    const { video, element, play, pause, load } = setup(() => pending.promise);

    video.assign(FIRST);
    video.activate();
    video.release();
    pending.resolve(FIRST_URL);
    await flushPromises();

    expect(pause).toHaveBeenCalledOnce();
    expect(load).not.toHaveBeenCalled();
    expect(element.hasAttribute("src")).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  test("removes the source and reloads when releasing a resolved video", async() => {
    const { video, element, pause, load } = setup();

    video.assign(FIRST);
    await flushPromises();
    video.release();

    expect(pause).toHaveBeenCalledOnce();
    expect(element.hasAttribute("src")).toBe(false);
    expect(load).toHaveBeenCalledOnce();
  });

  test("keeps a new assignment when the previous URL resolves late", async() => {
    const old = deferred<string>();
    const { video, element, play } = setup(media => (media === FIRST ? old.promise : Promise.resolve(SECOND_URL)));

    video.assign(FIRST);
    video.release();
    video.assign(SECOND);
    video.activate();
    await flushPromises();
    old.resolve(FIRST_URL);
    await flushPromises();

    expect(element.getAttribute("src")).toBe(SECOND_URL);
    expect(play).toHaveBeenCalledOnce();
  });

  test("reports a current URL failure", async() => {
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { video, element } = setup(() => Promise.reject(error));

    video.assign(FIRST);
    await flushPromises();

    expect(log).toHaveBeenCalledExactlyOnceWith(error);
    expect(element.hasAttribute("src")).toBe(false);
  });

  test("ignores an old assignment's URL failure", async() => {
    const old = deferred<string>();
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { video } = setup(() => old.promise);

    video.assign(FIRST);
    video.release();
    old.reject(new Error("stale failure"));
    await flushPromises();

    expect(log).not.toHaveBeenCalled();
  });

  test("ignores playback AbortError", async() => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { video, play } = setup();

    play.mockRejectedValue(new DOMException("interrupted", "AbortError"));

    video.assign(FIRST);
    await flushPromises();
    video.activate();
    await flushPromises();

    expect(play).toHaveBeenCalledOnce();
    expect(log).not.toHaveBeenCalled();
  });

  test("reports other playback DOMExceptions", async() => {
    const error = new DOMException("blocked", "NotAllowedError");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { video, play } = setup();

    play.mockRejectedValue(error);

    video.assign(FIRST);
    await flushPromises();
    video.activate();
    await flushPromises();

    expect(log).toHaveBeenCalledExactlyOnceWith(error);
  });

  test("reports non-DOM playback failures", async() => {
    const error = new Error("playback failed");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { video, play } = setup();

    play.mockRejectedValue(error);

    video.assign(FIRST);
    await flushPromises();
    video.activate();
    await flushPromises();

    expect(log).toHaveBeenCalledExactlyOnceWith(error);
  });
});
