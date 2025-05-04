/* eslint-disable camelcase */
import {describe, expect, test} from "vitest";
import {convertKeysToCamelCase} from "../utils/primitive/object";

describe("convertKeysToCamelCase", () => {
  test("empty", () => {
    expect(convertKeysToCamelCase({})).toStrictEqual({});
  });

  test("one word", () => {
    expect(convertKeysToCamelCase({foo: "bar"})).toStrictEqual({foo: "bar"});
    expect(convertKeysToCamelCase({foo: "bar", bar: "foo"})).toStrictEqual({foo: "bar", bar: "foo"});
  });

  test("two words", () => {
    expect(convertKeysToCamelCase({foo_bar: "baz"})).toStrictEqual({fooBar: "baz"});
    expect(convertKeysToCamelCase({foo_bar: "baz", bar_foo: "baz"})).toStrictEqual({fooBar: "baz", barFoo: "baz"});
  });

  test("three words", () => {
    expect(convertKeysToCamelCase({foo_bar_baz: 0})).toStrictEqual({fooBarBaz: 0});
    expect(convertKeysToCamelCase({foo_bar_baz: 0, bar_foo_baz: 1})).toStrictEqual({fooBarBaz: 0, barFooBaz: 1});
  });

  test("mixed case", () => {
    const record = {
      fooBarBaz: 0,
      bar_foo_baz: 0,
      foo_bar_baz_qux: 0,
      bar_foo_baz_qux: 0,
      fooBarBazQuxQuux: 0,
      bar_foo_baz_qux_quux: 0
    };

    expect(convertKeysToCamelCase(record)).toStrictEqual({
      fooBarBaz: 0,
      barFooBaz: 0,
      fooBarBazQux: 0,
      barFooBazQux: 0,
      fooBarBazQuxQuux: 0,
      barFooBazQuxQuux: 0
    });
  });
});
