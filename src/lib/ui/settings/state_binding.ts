import { Preference } from "@/lib/storage/preference";
import { Setting } from "@/lib/ui/settings/setting";
import { doNothing } from "@/utils/function";

export class StateBinding<T> {
  private currentValue: T;
  private readonly preference: Preference<T> | null;
  private readonly apply: (value: T) => void;
  private readonly render: (value: T) => void;

  constructor(setting: Partial<Setting<T>>, defaultValue: T, render: (value: T) => void) {
    this.preference = setting.preference ?? null;
    this.apply = setting.apply ?? doNothing;
    this.render = render;
    this.currentValue = this.preference === null ? defaultValue : this.preference.value;
    this.initialize(setting);
  }

  public get value(): T {
    return this.currentValue;
  }

  public set(next: T): void {
    if (next === this.currentValue) {
      return;
    }
    this.currentValue = next;
    this.rerender();
    this.commit(next);
  }

  protected commit(value: T): void {
    this.preference?.set(value);
    this.apply(value);
  }

  private rerender(): void {
    this.render(this.currentValue);
  }

  private initialize(setting: Partial<Setting<T>>): void {
    this.preference?.on((next) => {
      if (next !== this.currentValue) {
        this.currentValue = next;
        this.rerender();
      }
    });
    this.rerender();

    if (setting.applyOnBuild === true) {
      this.apply(this.currentValue);
    }
  }
}
