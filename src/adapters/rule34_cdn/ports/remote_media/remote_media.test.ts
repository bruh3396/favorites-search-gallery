import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";

const VIDEO: Media = { kind: "video", locator: "1234/a1b2c3" };
const ORIGINAL = "https://original/1234/a1b2c3.mp4";
const IMAGE = "https://original/1234/a1b2c3.jpg";
const BITMAP = { close: (): void => undefined } as ImageBitmap;

interface Rule34Cdn {
  previewUrl: ReturnType<typeof vi.fn<(media: Media) => string>>;
  originalUrl: ReturnType<typeof vi.fn<(media: Media) => Promise<string>>>;
  imageUrl: ReturnType<typeof vi.fn<(media: Media) => Promise<string>>>;
  decodeImage: ReturnType<typeof vi.fn<(media: Media, signal?: AbortSignal) => Promise<ImageBitmap>>>;
  decodeOriginal: ReturnType<typeof vi.fn<(media: Media, signal?: AbortSignal) => Promise<ImageBitmap>>>;
  readVideoDurationSeconds: ReturnType<typeof vi.fn<(media: Media) => Promise<number>>>;
}

function setup(): { source: Rule34CdnRemoteMedia; rule34Cdn: Rule34Cdn } {
  const rule34Cdn: Rule34Cdn = {
    previewUrl: vi.fn((media: Media) => `https://preview/${media.locator}`),
    originalUrl: vi.fn(() => Promise.resolve(ORIGINAL)),
    imageUrl: vi.fn(() => Promise.resolve(IMAGE)),
    decodeImage: vi.fn(() => Promise.resolve(BITMAP)),
    decodeOriginal: vi.fn(() => Promise.resolve(BITMAP)),
    readVideoDurationSeconds: vi.fn(() => Promise.resolve(12))
  };
  return { source: new Rule34CdnRemoteMedia(rule34Cdn), rule34Cdn };
}

describe("Rule34CdnRemoteMedia", () => {
  test("gives a preview's URL", async() => {
    expect(await setup().source.resolvePreviewUrl(VIDEO)).toBe("https://preview/1234/a1b2c3");
  });

  test("gives an original's URL", async() => {
    const { source, rule34Cdn } = setup();

    expect(await source.resolveOriginalUrl(VIDEO)).toBe(ORIGINAL);
    expect(rule34Cdn.originalUrl).toHaveBeenCalledWith(VIDEO);
  });

  test("gives an image-compatible URL", async() => {
    const { source, rule34Cdn } = setup();

    expect(await source.resolveImageUrl(VIDEO)).toBe(IMAGE);
    expect(rule34Cdn.imageUrl).toHaveBeenCalledWith(VIDEO);
  });

  test("decodes the image", async() => {
    const { source, rule34Cdn } = setup();
    const signal = new AbortController().signal;

    expect(await source.decodeImage(VIDEO, signal)).toBe(BITMAP);
    expect(rule34Cdn.decodeImage).toHaveBeenCalledWith(VIDEO, signal);
  });

  test("decodes the original", async() => {
    const { source, rule34Cdn } = setup();
    const signal = new AbortController().signal;

    expect(await source.decodeOriginal(VIDEO, signal)).toBe(BITMAP);
    expect(rule34Cdn.decodeOriginal).toHaveBeenCalledWith(VIDEO, signal);
  });

  test("reads the original's duration", async() => {
    const { source, rule34Cdn } = setup();

    expect(await source.fetchDurationSeconds(VIDEO)).toBe(12);
    expect(rule34Cdn.readVideoDurationSeconds).toHaveBeenCalledWith(VIDEO);
  });
});
