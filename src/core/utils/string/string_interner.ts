import { copyString } from "@/core/utils/string/string_utilities";

export class StringInterner {
  private readonly strings = new Map<string, string>();

  public intern(value: string): string {
    const existing = this.strings.get(value);

    if (existing !== undefined) {
      return existing;
    }
    const flat = copyString(value);

    this.strings.set(flat, flat);
    return flat;
  }
}
