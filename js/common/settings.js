class Settings {
  static minColumnCount = 2;
  static maxColumnCount = 20;
  static maxRowSize = 10;
  static minRowSize = 1;
  static minResultsPerPage = 1;
  static maxResultsPerPage = 5000;
  static resultsPerPageStep = 25;
  static maxPageNumberButtonCount = 5;
  /** @type {MediaExtension} */
  static defaultExtension = "jpg";
  static galleryMenuEnabled = true;
}

class Constants {
  static animatedTagSet = new Set(["video", "mp4", "animated_png", "gif", "animated"]);
  static videoTagSet = new Set(["video", "mp4"]);
  static doNothing = () => {};
}
