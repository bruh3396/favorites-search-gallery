export interface Scheduler {
  schedule: (task: () => void, delay: number) => () => void;
}
