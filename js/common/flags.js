class Flags {
  static onSearchPage = location.href.includes("page=post&s=list");
  static onFavoritesPage = location.href.includes("page=favorites");
  static onPostPage = location.href.includes("page=post&s=view");
  static usingFirefox = navigator.userAgent.toLowerCase().includes("firefox");
  static onMobileDevice = (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent);
  static onDesktopDevice = !Flags.onMobileDevice;
  static userIsOnTheirOwnFavoritesPage = Utils.getUserId() === Utils.getFavoritesPageId();
  static galleryDisabled = (Flags.onMobileDevice && Flags.onSearchPage) || Preferences.performanceProfile.value > 0 || Flags.onPostPage;
  static galleryEnabled = !Flags.galleryDisabled;
}
