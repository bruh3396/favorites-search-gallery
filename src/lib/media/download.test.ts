import { afterEach, describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { downloadMedia } from "@/lib/media/download";

const MEDIA: Media = { kind: "image", locator: "1/7" };

function setup(type: string): { remoteMedia: Pick<RemoteMedia, "fetchOriginal">; requested: Media[]; saved: string[] } {
  const requested: Media[] = [];
  const saved: string[] = [];

  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:media");
  vi.spyOn(URL, "revokeObjectURL").mockReturnValue();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function save(this: HTMLAnchorElement): void {
    saved.push(this.download);
  });
  const remoteMedia = {
    fetchOriginal: (media: Media): Promise<Blob> => {
      requested.push(media);
      return Promise.resolve(new Blob([new Uint8Array([1])], { type }));
    }
  };
  return { remoteMedia, requested, saved };
}

describe("downloadMedia", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    ["image/png", "7.png"],
    ["video/mp4", "7.mp4"],
    ["application/octet-stream", "7.bin"]
  ])("saves a %s original as %s", async(type, filename) => {
    const { remoteMedia, requested, saved } = setup(type);

    await downloadMedia(remoteMedia, { id: "7", media: MEDIA });

    expect(requested).toEqual([MEDIA]);
    expect(saved).toEqual([filename]);
  });
});
