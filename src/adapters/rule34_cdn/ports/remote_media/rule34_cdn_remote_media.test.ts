import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/rule34_cdn_remote_media";

const VIDEO: Media = { kind: "video", locator: "1234/a1b2c3" };
const RESOLVED: Media = { kind: "video", locator: "1234/a1b2c3.mp4" };
const ORIGINAL = "https://original/1234/a1b2c3.mp4";
const BITMAP = { close: (): void => undefined } as ImageBitmap;
const IMAGE = document.createElement("img");
const FILE = new Blob(["video"], { type: "video/mp4" });

interface FakeRule34CdnClient {
  resolveMedia: ReturnType<typeof vi.fn<(media: Media) => Promise<Media>>>;
  previewUrl: ReturnType<typeof vi.fn<(media: Media) => string>>;
  originalUrl: ReturnType<typeof vi.fn<(media: Media) => Promise<string>>>;
  decodeStill: ReturnType<typeof vi.fn<(media: Media, signal?: AbortSignal, width?: number) => Promise<ImageBitmap>>>;
  loadOriginal: ReturnType<typeof vi.fn<(media: Media, signal?: AbortSignal) => Promise<HTMLImageElement>>>;
  fetchOriginal: ReturnType<typeof vi.fn<(media: Media) => Promise<Blob>>>;
  probeDurationSeconds: ReturnType<typeof vi.fn<(media: Media) => Promise<number>>>;
}

function setup(): { remoteMedia: Rule34CdnRemoteMedia; rule34CdnClient: FakeRule34CdnClient } {
  const rule34CdnClient: FakeRule34CdnClient = {
    resolveMedia: vi.fn(() => Promise.resolve(RESOLVED)),
    previewUrl: vi.fn((media: Media) => `https://preview/${media.locator}`),
    originalUrl: vi.fn(() => Promise.resolve(ORIGINAL)),
    decodeStill: vi.fn(() => Promise.resolve(BITMAP)),
    loadOriginal: vi.fn(() => Promise.resolve(IMAGE)),
    fetchOriginal: vi.fn(() => Promise.resolve(FILE)),
    probeDurationSeconds: vi.fn(() => Promise.resolve(12))
  };
  return { remoteMedia: new Rule34CdnRemoteMedia(rule34CdnClient), rule34CdnClient };
}

describe("Rule34CdnRemoteMedia", () => {
  test("resolves media", async() => {
    const { remoteMedia, rule34CdnClient } = setup();

    expect(await remoteMedia.resolveMedia(VIDEO)).toBe(RESOLVED);
    expect(rule34CdnClient.resolveMedia).toHaveBeenCalledWith(VIDEO);
  });

  test("gives a preview's URL", () => {
    expect(setup().remoteMedia.resolvePreviewUrl(VIDEO)).toBe("https://preview/1234/a1b2c3");
  });

  test("gives an original's URL", async() => {
    const { remoteMedia, rule34CdnClient } = setup();

    expect(await remoteMedia.resolveOriginalUrl(VIDEO)).toBe(ORIGINAL);
    expect(rule34CdnClient.originalUrl).toHaveBeenCalledWith(VIDEO);
  });

  test("decodes the still", async() => {
    const { remoteMedia, rule34CdnClient } = setup();
    const signal = new AbortController().signal;

    expect(await remoteMedia.decodeStill(VIDEO, signal, 500)).toBe(BITMAP);
    expect(rule34CdnClient.decodeStill).toHaveBeenCalledWith(VIDEO, signal, 500);
  });

  test("loads the original", async() => {
    const { remoteMedia, rule34CdnClient } = setup();
    const signal = new AbortController().signal;

    expect(await remoteMedia.loadOriginal(VIDEO, signal)).toBe(IMAGE);
    expect(rule34CdnClient.loadOriginal).toHaveBeenCalledWith(VIDEO, signal);
  });

  test("fetches the original's file", async() => {
    const { remoteMedia, rule34CdnClient } = setup();

    expect(await remoteMedia.fetchOriginal(VIDEO)).toBe(FILE);
    expect(rule34CdnClient.fetchOriginal).toHaveBeenCalledWith(VIDEO);
  });

  test("probes the original's duration", async() => {
    const { remoteMedia, rule34CdnClient } = setup();

    expect(await remoteMedia.probeDurationSeconds(VIDEO)).toBe(12);
    expect(rule34CdnClient.probeDurationSeconds).toHaveBeenCalledWith(VIDEO);
  });
});
