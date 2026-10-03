import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

export async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    await Promise.resolve();
  }
}

export async function advanceAndSettle(scheduler: MemoryScheduler, duration: number): Promise<void> {
  const step = 10;

  let elapsed = 0;

  await flushMicrotasks();
  do {
    const advance = Math.min(step, duration - elapsed);

    scheduler.advance(advance);
    elapsed += advance;
    await flushMicrotasks();
  } while (elapsed < duration);
}
