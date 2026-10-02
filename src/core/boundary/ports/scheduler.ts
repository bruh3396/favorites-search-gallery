export interface Scheduler {
  now: () => number;
  schedule: (task: () => void, delay: number) => () => void;
}