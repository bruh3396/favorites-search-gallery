class Upscaler {
  /**
   * @type {Map.<String, OffscreenCanvas>}
   */
  canvases;

  constructor() {
    this.canvases = new Map();
    self.onmessage = this.handleMessage.bind(this);
  }

  /**
   * @param {any} message
   */
  handleMessage(message) {
    const request = message.data;

    switch (request.action) {
      case "upscale":
        this.upscale(request);
        break;

      default:
        break;
    }
  }

  /**
   *
   * @param {{id: String, canvas: OffscreenCanvas | null, imageBitmap: ImageBitmap}} request
   */
  upscale(request) {
    const canvas = this.canvases.get(request.id) || request.canvas;

    if (canvas === null) {
      return;
    }
    this.canvases.set(request.id, canvas);
    this.drawCanvas(canvas.getContext("2d"), request.imageBitmap);
    request.imageBitmap.close();
  }

  /**
   * @param {OffscreenCanvasRenderingContext2D | null} context
   * @param {ImageBitmap} imageBitmap
   */
  drawCanvas(context, imageBitmap) {
    if (context === null) {
      return;
    }
    const canvas = context.canvas;
    const ratio = Math.min(canvas.width / imageBitmap.width, canvas.height / imageBitmap.height);
    const centerShiftX = (canvas.width - (imageBitmap.width * ratio)) / 2;
    const centerShiftY = (canvas.height - (imageBitmap.height * ratio)) / 2;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
      centerShiftX, centerShiftY, imageBitmap.width * ratio, imageBitmap.height * ratio
    );
  }
}

const upscaler = new Upscaler();
