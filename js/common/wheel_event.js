class FavoritesWheelEvent {
  /**
   * @type {WheelEvent}
   */
  originalEvent;
  /**
   * @type {NavigationKey}
   */
  direction;

  /**
   * @param {WheelEvent} wheelEvent
   */
  constructor(wheelEvent) {
    this.originalEvent = wheelEvent;
    this.direction = wheelEvent.deltaY > 0 ? "ArrowRight" : "ArrowLeft";
  }
}
