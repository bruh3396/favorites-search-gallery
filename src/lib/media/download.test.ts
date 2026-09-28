import { afterEach, describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MediaSource } from "@/core/boundary/ports/media_source";
import { downloadMedia } from "@/lib/media/download";

const MEDIA: Media = { kind: "image", locator: "1/7" };

function setup(type: string): { mediaSource: Pick<MediaSource, "fetchOriginal">; requested: Media[]; saved: string[] } {
  const requested: Media[] = [];
  const saved: string[] = [];

  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:media");
  vi.spyOn(URL, "revokeObjectURL").mockReturnValue();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function save(this: HTMLAnchorElement): void {
    saved.push(this.download);
  });
  const mediaSource = {
    fetchOriginal: (media: Media): Promise<Blob> => {
      requested.push(media);
      return Promise.resolve(new Blob([new Uint8Array([1])], { type }));
    }
  };
  return { mediaSource, requested, saved };
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
    const { mediaSource, requested, saved } = setup(type);

    await downloadMedia(mediaSource, { id: "7", media: MEDIA });

    expect(requested).toEqual([MEDIA]);
    expect(saved).toEqual([filename]);
  });
});
