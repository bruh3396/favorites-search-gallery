import { expect } from "vitest";

export function expectClassesStyled(classes: Readonly<Record<string, string>>, css: string): void {
  const unstyled = Object.values(classes).filter(name => !new RegExp(`\\.${name}(?![\\w-])`).test(css));

  expect(unstyled, "classes missing from the stylesheet").toEqual([]);
}
