export function toCamelCase(variable: string): string {
  return variable.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
}
