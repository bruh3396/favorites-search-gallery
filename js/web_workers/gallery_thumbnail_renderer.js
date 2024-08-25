/**
 * @type {Map.<String, OffscreenCanvas>}
 */
let OFFSCREEN_CANVASES = new Map();
let screenWidth = 1080;

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {ImageBitmap} imageBitmap
 * @param {String} id
 * @param {Number} maxResolutionFraction
 */
function draw(offscreenCanvas, imageBitmap, id, maxResolutionFraction) {
  OFFSCREEN_CANVASES.set(id, offscreenCanvas);
  setOffscreenCanvasDimensions(offscreenCanvas, imageBitmap, maxResolutionFraction);
  drawOffscreenCanvas(offscreenCanvas, imageBitmap);
}

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {ImageBitmap} imageBitmap
 * @param {Number} maxResolutionFraction
 */
function setOffscreenCanvasDimensions(offscreenCanvas, imageBitmap, maxResolutionFraction) {
  const newWidth = screenWidth / maxResolutionFraction;
  const ratio = newWidth / imageBitmap.width;
  const newHeight = ratio * imageBitmap.height;

  offscreenCanvas.width = newWidth;
  offscreenCanvas.height = newHeight;
}

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {ImageBitmap} imageBitmap
 */
function drawOffscreenCanvas(offscreenCanvas, imageBitmap) {
  const context = offscreenCanvas.getContext("2d");
  const ratio = Math.min(offscreenCanvas.width / imageBitmap.width, offscreenCanvas.height / imageBitmap.height);
  const centerShiftX = (offscreenCanvas.width - (imageBitmap.width * ratio)) / 2;
  const centerShiftY = (offscreenCanvas.height - (imageBitmap.height * ratio)) / 2;

  context.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  context.drawImage(
    imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
    centerShiftX, centerShiftY, imageBitmap.width * ratio, imageBitmap.height * ratio
  );
  imageBitmap.close();
}

function deleteAllCanvases() {
  for (const id of OFFSCREEN_CANVASES.keys()) {
    let offscreenCanvas = OFFSCREEN_CANVASES.get(id);

    offscreenCanvas.getContext("2d").clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    offscreenCanvas = null;
    OFFSCREEN_CANVASES.set(id, offscreenCanvas);
    OFFSCREEN_CANVASES.delete(id);
  }
  OFFSCREEN_CANVASES.clear();
  OFFSCREEN_CANVASES = new Map();
}

onmessage = (message) => {
  message = message.data;

  switch (message.action) {
    case "draw":
      draw(message.offscreenCanvas, message.imageBitmap, message.id, message.maxResolutionFraction);
      break;

    case "setScreenWidth":
      screenWidth = message.screenWidth;
      break;

    case "deleteAll":
      deleteAllCanvases();
      break;

    default:
      break;
  }
};
