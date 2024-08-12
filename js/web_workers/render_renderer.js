/* eslint-disable prefer-template */
const RETRY_DELAY_INCREMENT = 1000;
let retryDelay = 0;

async function drawCanvas(imageURL, canvas, extension, postId, thumbIndex) {
  const extensionAlreadyFound = extension !== null && extension !== undefined;
  let newExtension = extension;

  if (extensionAlreadyFound) {
    imageURL = imageURL.replace("jpg", extension);
  } else {
    imageURL = await getOriginalImageURL(postId);
    newExtension = getExtensionFromImageURL(imageURL);
  }
  const result = await fetchImage(imageURL);

  if (result) {
    await drawCanvasFromBlob(result.blob, canvas);
    setTimeout(() => {
      postMessage({
        newExtension,
        postId,
        thumbIndex,
        extensionAlreadyFound
      });
    }, 50);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getOriginalImageURLFromPostPage(postId) {
  return fetch("https://rule34.xxx/index.php?page=post&s=view&id=" + postId)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(response.status + ": " + postPageURL);
    })
    .then((html) => {
      postMessage({
        gotPostPageHTML: html,
        postId
      });
      const imageURL = (/itemprop="image" content="(.*)"/g).exec(html);
      return imageURL[1].replace("us.rule34", "rule34");
    }).catch(async(error) => {
      if (!error.message.includes("503")) {
        console.error(error);
        return "https://rule34.xxx/images/r34chibi.png";
      }
      await sleep(retryDelay);
      retryDelay += RETRY_DELAY_INCREMENT;

      if (retryDelay > RETRY_DELAY_INCREMENT * 5) {
        retryDelay = RETRY_DELAY_INCREMENT;
      }
      return getOriginalImageURL(postPageURL);
    });
}

function getOriginalImageURL(postId) {
  return fetch("https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=" + postId)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(response.status + ": " + postId);
    })
    .then((html) => {
      let url;

      try {
        url = (/ file_url="(.*?)"/).exec(html)[1].replace("api-cdn.", "");
      } catch (error) {
        url = "";
      }
      return url;
    }).catch(() => {
      return getOriginalImageURLFromPostPage(postId);
    });
}

async function fetchImage(imageURL) {
  const response = await fetch(imageURL);

  if (response.ok) {
    const blob = await response.blob();
    return {
      url: imageURL,
      blob
    };
  }
  return {
    url: imageURL,
    error: response.statusText
  };
}

async function drawCanvasFromBlob(blob, canvas) {
  const imageBitmap = await createImageBitmap(blob);
  const context = canvas.getContext("2d");

  context.drawImage(imageBitmap, 0, 0);
  drawScaledCanvas(imageBitmap, context);
}

function drawScaledCanvas(imageBitmap, context) {
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

function getExtensionFromImageURL(imageURL) {
  return (/\.(png|jpg|jpeg|gif)/g).exec(imageURL)[1];
}

async function getImageExtensionFromPostId(postId) {
  const imageURL = await getOriginalImageURL(postId);
  return getExtensionFromImageURL(imageURL);
}

onmessage = async(message) => {
  const request = message.data;

  if (request.findExtension) {
    const extension = await getImageExtensionFromPostId(request.postId);

    postMessage({
      foundExtension: extension,
      postId: request.postId
    });
  } else {
    await drawCanvas(request.imageURL, request.offscreenCanvas, request.extension, request.postId, request.thumbIndex);
  }
};
