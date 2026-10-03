import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";

const VIDEO: Media = { kind: "video", locator: "1234/a1b2c3" };
const ORIGINAL = "https://original/1234/a1b2c3.mp4";
const IMAGE = "https://original/1234/a1b2c3.jpg";

interface Rule34Cdn {
  previewUrl: ReturnType<typeof vi.fn<(locator: string) => string>>;
  originalUrl: ReturnType<typeof vi.fn<(locator: string, kind: string) => Promise<string>>>;
  imageUrl: ReturnType<typeof vi.fn<(locator: string, kind: string) => Promise<string>>>;
  fetchFile: ReturnType<typeof vi.fn<(url: string, signal?: AbortSignal) => Promise<Blob>>>;
  readVideoDurationSeconds: ReturnType<typeof vi.fn<(url: string) => Promise<number>>>;
}

function setup(): { source: Rule34CdnRemoteMedia; rule34Cdn: Rule34Cdn } {
  const rule34Cdn: Rule34Cdn = {
    previewUrl: vi.fn((locator: string) => `https://preview/${locator}`),
    originalUrl: vi.fn(() => Promise.resolve(ORIGINAL)),
    imageUrl: vi.fn(() => Promise.resolve(IMAGE)),
    fetchFile: vi.fn(() => Promise.resolve(new Blob(["bytes"]))),
    readVideoDurationSeconds: vi.fn(() => Promise.resolve(12))
  };
  return { source: new Rule34CdnRemoteMedia(rule34Cdn), rule34Cdn };
}

describe("Rule34CdnRemoteMedia", () => {
  test("gives a preview's URL from the locator", async() => {
    expect(await setup().source.resolvePreviewUrl(VIDEO)).toBe("https://preview/1234/a1b2c3");
  });

  test("gives an original's URL from the locator and kind", async() => {
    const { source, rule34Cdn } = setup();

    expect(await source.resolveOriginalUrl(VIDEO)).toBe(ORIGINAL);
    expect(rule34Cdn.originalUrl).toHaveBeenCalledWith("1234/a1b2c3", "video");
  });

  test("gives an image's URL from the locator and kind", async() => {
    const { source, rule34Cdn } = setup();

    expect(await source.resolveImageUrl(VIDEO)).toBe(IMAGE);
    expect(rule34Cdn.imageUrl).toHaveBeenCalledWith("1234/a1b2c3", "video");
  });

  test("fetches the original's bytes", async() => {
    const { source, rule34Cdn } = setup();
    const signal = new AbortController().signal;

    expect(await (await source.fetchOriginal(VIDEO, signal)).text()).toBe("bytes");
    expect(rule34Cdn.fetchFile).toHaveBeenCalledWith(ORIGINAL, signal);
  });

  test("reads the original's duration", async() => {
    const { source, rule34Cdn } = setup();

    expect(await source.fetchDurationSeconds(VIDEO)).toBe(12);
    expect(rule34Cdn.readVideoDurationSeconds).toHaveBeenCalledWith(ORIGINAL);
  });
});
