import { afterEach, describe, expect, test } from "vitest";
import * as Environment from "@/app/context/environment";
import { setEnvironment, resetEnvironment } from "@/app/context/environment";

describe("environment", () => {
  afterEach(() => resetEnvironment());

  test("loads under Node without touching undefined browser globals", () => {
    expect(typeof Environment.ON_MOBILE_DEVICE).toBe("boolean");
    expect(typeof Environment.VERSION).toBe("string");
  });

  test("setEnvironment overrides a flag and consumers see it via live bindings", async () => {
    setEnvironment({ ON_FAVORITES_PAGE: true, ON_MOBILE_DEVICE: false });
    const env = await import("@/app/context/environment");

    expect(env.ON_FAVORITES_PAGE).toBe(true);
    expect(env.ON_MOBILE_DEVICE).toBe(false);
  });

  test("resetEnvironment restores computed values", () => {
    setEnvironment({ ON_FAVORITES_PAGE: true });
    resetEnvironment();
    expect(Environment.ON_FAVORITES_PAGE).toBe(false);
  });
});
