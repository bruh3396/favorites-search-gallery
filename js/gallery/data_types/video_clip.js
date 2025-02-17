class VideoClip {
  /**
   * @type {Number}
   */
  start;
  /**
   * @type {Number}
   */
  end;

  /**
   * @param {{start: Number, end: Number}} videoClip
   */
  constructor(videoClip) {
    this.start = videoClip.start;
    this.end = videoClip.end;
  }
}
