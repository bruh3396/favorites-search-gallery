export const AutoplayConfig = {
  menuVisibilityTime: { mobile: 1_500, desktop: 1_000 },
  menuShowThrottleTime: 250,
  menuActivationEvent: { mobile: "touchstart", desktop: "click" },
  menuHoldEvents: {
    mobile: [] as [string, boolean][],
    desktop: [["mouseenter", true], ["mouseleave", false]] as [string, boolean][]
  },
  durations: {
    image: { min: 1, max: 60, options: [1, 2, 3, 4, 5, 10, 15, 20, 30, 60] },
    minimumVideo: { min: 0, max: 60, options: [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 60] }
  }
};
