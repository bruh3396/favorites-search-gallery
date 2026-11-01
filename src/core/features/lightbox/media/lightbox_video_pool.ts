export interface LightboxVideoPoolConfiguration {
  readonly capacity: number;
}

export class LightboxVideoPool {
  private readonly free: HTMLVideoElement[];

  constructor(configuration: LightboxVideoPoolConfiguration, createVideo: () => HTMLVideoElement) {
    this.free = Array.from({ length: configuration.capacity }, createVideo);
  }

  public acquire(url: string): HTMLVideoElement {
    const video = this.free.pop();

    if (video === undefined) {
      throw new Error("No free video element");
    }
    video.src = url;
    return video;
  }

  public release(video: HTMLVideoElement): void {
    video.pause();
    video.removeAttribute("src");
    video.load();
    this.free.push(video);
  }
}
