export interface Scheduler {
  now: () => number;
  schedule: (task: () => void, delay: number) => () => void;
  sleep: (duration: number) => Promise<void>;
  waitForPaint: () => Promise<void>;
}
