import { Preference } from "@/lib/storage/preference";
import { Setting } from "@/lib/ui/settings/setting";

export class StateBinding<T> {
  private currentValue: T;
  private readonly preference: Preference<T> | null;
  private readonly render: (value: T) => void;

  constructor(setting: Partial<Setting<T>>, defaultValue: T, render: (value: T) => void) {
    this.preference = setting.preference ?? null;
    this.render = render;
    this.currentValue = this.preference === null ? defaultValue : this.preference.value;
    this.initialize();
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
  }

  private rerender(): void {
    this.render(this.currentValue);
  }

  private initialize(): void {
    this.preference?.on((next) => {
      if (next !== this.currentValue) {
        this.currentValue = next;
        this.rerender();
      }
    });
    this.rerender();
  }
}
