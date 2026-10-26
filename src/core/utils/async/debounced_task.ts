import { Debouncer, DebouncerConfiguration } from "@/core/utils/async/debouncer";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export type DebouncedTask<Args extends unknown[]> = {
  (...args: Args): void;
  cancel(): void;
};

export function createDebouncedTask<Args extends unknown[]>(
  configuration: DebouncerConfiguration,
  scheduler: Pick<Scheduler, "schedule">,
  task: (...args: Args) => void
): DebouncedTask<Args> {
  const debouncer = new Debouncer(configuration, scheduler);
  return Object.assign(
    (...args: Args): void => {
      debouncer.debounce(() => task(...args));
    },
    { cancel: (): void => debouncer.cancel() }
  );
}
