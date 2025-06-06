class GalleryInputHandler {
  static {
    Utils.addStaticInitializer(GalleryInputHandler.setup);
  }

  static setup() {
    GalleryController.prototype.setupCustomUiEventHandler = function () {
      // @ts-ignore
      this.view.container.addEventListener("galleryController", (/** @type CustomEvent */ event) => {
        switch (event.detail) {
          case "exitGallery":
            this.executeFunctionBasedOnGalleryState({
              gallery: this.exitGallery.bind(this)
            });
            break;

          case "openPost":
            this.model.openPostInNewTab();
            break;

          case "openOriginal":
            this.model.openOriginalContentInNewTab();
            break;

          case "download":
            this.model.download();
            break;

          case "addFavorite":
            this.addCurrentFavorite();
            break;

          case "removeFavorite":
            this.removeCurrentFavorite();
            break;

          case "toggleBackground":
            this.view.toggleBackgroundOpacity();
            break;

          default:
            break;
        }
      });
    };
  }
}
