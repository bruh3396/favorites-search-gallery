import {toCamelCase} from "./string";

export function convertKeysToCamelCase<T>(record: Record<string, T>): Record<string, T> {
  return Object.keys(record).reduce((newRecord, key) => {
    const camelCaseKey = toCamelCase(key);

    newRecord[camelCaseKey] = record[key];
    return newRecord;
  }, {} as Record<string, T>);
}
