import { describe, expect, test } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";

function setup(): { emitter: Emitter<number>; heard: number[] } {
  return { emitter: new Emitter<number>(), heard: [] };
}

describe("Emitter", () => {
  test("delivers every emit to its listeners", () => {
    const { emitter, heard } = setup();

    emitter.on(value => heard.push(value));
    emitter.emit(1);
    emitter.emit(1);
    expect(heard).toEqual([1, 1]);
  });

  test("stops a listener when its unsubscribe is called", () => {
    const { emitter, heard } = setup();
    const off = emitter.on(value => heard.push(value));

    emitter.emit(1);
    off();
    emitter.emit(2);
    expect(heard).toEqual([1]);
  });

  test("delivers only the first emit to a once listener", () => {
    const { emitter, heard } = setup();

    emitter.once(value => heard.push(value));
    emitter.emit(1);
    emitter.emit(2);
    expect(heard).toEqual([1]);
  });

  test("works when its methods are passed as callbacks", () => {
    const { emitter, heard } = setup();
    const { on, once, emit } = emitter;

    on(value => heard.push(value));
    once(value => heard.push(value * 10));
    emit(3);
    expect(heard).toEqual([3, 30]);
  });
});
