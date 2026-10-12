import { Mock, describe, expect, test, vi } from "vitest";
import { Rule34CdnImageDecoder, Rule34CdnImageDecoderDependencies } from "@/adapters/rule34_cdn/client/image_decoder";

const FILE_URL = "https://rule34.xxx/images//1234/a1b2c3.png";
const WIMG_URL = "https://wimg.rule34.xxx/images//1234/a1b2c3.png";
const IMAGE = { tagName: "IMG" } as HTMLImageElement;
const BITMAP = { close: (): void => undefined } as ImageBitmap;

interface Setup {
  decoder: Rule34CdnImageDecoder;
  fetch: Mock<Rule34CdnImageDecoderDependencies["fetch"]>;
  loadImage: Mock<Rule34CdnImageDecoderDependencies["loadImage"]>;
  decodeBitmap: Mock<Rule34CdnImageDecoderDependencies["decodeBitmap"]>;
}

function setup(
  respond: Rule34CdnImageDecoderDependencies["fetch"] = () => Promise.resolve(new Response("bytes")),
  load: Rule34CdnImageDecoderDependencies["loadImage"] = () => Promise.resolve(IMAGE)
): Setup {
  const fetch = vi.fn(respond);
  const loadImage = vi.fn(load);
  const decodeBitmap = vi.fn<Rule34CdnImageDecoderDependencies["decodeBitmap"]>(() => Promise.resolve(BITMAP));
  return { decoder: new Rule34CdnImageDecoder({ fetch, loadImage, decodeBitmap }), fetch, loadImage, decodeBitmap };
}

function refuseFetch(): Promise<Response> {
  return Promise.reject(new TypeError("Failed to fetch"));
}

describe("Rule34CdnImageDecoder", () => {
  test("decodes the fetched bytes", async() => {
    const { decoder, fetch, loadImage, decodeBitmap } = setup();
    const signal = new AbortController().signal;

    expect(await decoder.decode(FILE_URL, signal)).toBe(BITMAP);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(FILE_URL, { signal });
    expect(await (decodeBitmap.mock.calls[0][0] as Blob).text()).toBe("bytes");
    expect(loadImage).not.toHaveBeenCalled();
  });

  test("decodes the WIMG image element when the fetch fails", async() => {
    const { decoder, loadImage, decodeBitmap } = setup(refuseFetch);
    const signal = new AbortController().signal;

    expect(await decoder.decode(FILE_URL, signal)).toBe(BITMAP);
    expect(loadImage).toHaveBeenCalledExactlyOnceWith(WIMG_URL, signal);
    expect(decodeBitmap).toHaveBeenCalledExactlyOnceWith(IMAGE);
  });

  test("falls back to WIMG when the host answers with an error", async() => {
    const { decoder, loadImage } = setup(() => Promise.resolve(new Response(null, { status: 404 })));

    await decoder.decode(FILE_URL);
    expect(loadImage).toHaveBeenCalledExactlyOnceWith(WIMG_URL, undefined);
  });

  test("goes straight to WIMG for a file that needed it before", async() => {
    const { decoder, fetch, loadImage } = setup(refuseFetch);

    await decoder.decode(FILE_URL);
    await decoder.decode(FILE_URL);
    expect(fetch).toHaveBeenCalledOnce();
    expect(loadImage).toHaveBeenCalledTimes(2);
  });

  test("tries the fetch again when the WIMG image failed too", async() => {
    const { decoder, fetch } = setup(refuseFetch, () => Promise.reject(new Error("Could not load image")));

    await expect(decoder.decode(FILE_URL)).rejects.toThrow("Could not load image");
    await expect(decoder.decode(FILE_URL)).rejects.toThrow("Could not load image");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("rejects a cancelled fetch without falling back", async() => {
    const controller = new AbortController();
    const { decoder, loadImage } = setup(() => {
      controller.abort();
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    });

    await expect(decoder.decode(FILE_URL, controller.signal)).rejects.toThrow("Aborted");
    expect(loadImage).not.toHaveBeenCalled();
  });
});
