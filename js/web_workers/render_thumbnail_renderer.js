/**
 * @type {Map.<String, OffscreenCanvas>}
 */
const offscreenCanvases = new Map();
const screenWidthFraction = 3;
let screenWidth = 1080;

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {ImageBitmap} imageBitmap
 * @param {String} id
 * @param {Number} width
 * @param {Number} height
 */
function draw(offscreenCanvas, imageBitmap, id, width, height) {
  if (offscreenCanvas === undefined) {
    offscreenCanvas = offscreenCanvases.get(id);
  } else {
    offscreenCanvases.set(id, offscreenCanvas);
  }
  setOffscreenCanvasDimensions(offscreenCanvas, width, height);
  drawCanvas(offscreenCanvas, imageBitmap, id);
}

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {Number} width
 * @param {Number} height
 */
function setOffscreenCanvasDimensions(offscreenCanvas, width, height) {
  const newWidth = screenWidth / screenWidthFraction;
  const ratio = newWidth / width;
  const newHeight = ratio * height;

  offscreenCanvas.width = Math.round(newWidth);
  offscreenCanvas.height = Math.round(newHeight);
}

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {ImageBitmap} imageBitmap
 */
function drawCanvas(offscreenCanvas, imageBitmap, id) {
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
  postMessage({
    action: "finishedDrawing",
    id
  });
}

onmessage = (message) => {
  message = message.data;

  switch (message.action) {
    case "draw":
      draw(message.offscreenCanvas, message.imageBitmap, message.id, message.width, message.height);
      break;

    case "setScreenWidth":
      screenWidth = message.screenWidth;
      break;

    case "delete":
      break;

    default:
      break;
  }
};
