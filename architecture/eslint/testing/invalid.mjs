export function expectInvalid(rule, invalid) {
  if (!Array.isArray(invalid) || invalid.length === 0) {
    throw new Error(`${rule} needs at least one invalid case, so the test proves it fires`);
  }
}
