import { Setting } from "@/lib/ui/settings/setting";
import { StateBinding } from "@/lib/ui/settings/state_binding";
import { debounceTrailing } from "@/lib/async/debounce";

export class DebouncedStateBinding<T> extends StateBinding<T> {
  private readonly commitLater: (value: T) => void;

  constructor(setting: Partial<Setting<T>>, defaultValue: T, render: (value: T) => void, delay: number) {
    super(setting, defaultValue, render);
    this.commitLater = debounceTrailing((value: T) => {
      super.commit(value);
    }, delay);
  }

  protected override commit(value: T): void {
    this.commitLater(value);
  }
}
