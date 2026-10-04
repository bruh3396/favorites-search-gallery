import { expect } from "vitest";

// Every class a component sets must be styled by its stylesheet, so a renamed class can't silently lose its rules.
export function expectClassesStyled(classes: Readonly<Record<string, string>>, css: string): void {
  const unstyled = Object.values(classes).filter(name => !new RegExp(`\\.${name}(?![\\w-])`).test(css));

  expect(unstyled, "classes missing from the stylesheet").toEqual([]);
}
