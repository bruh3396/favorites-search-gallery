import { describe, expect, test } from "vitest";
import { RequestError } from "@/core/utils/error/request_error";

describe("RequestError", () => {
  test("names its reason, subject, and status", () => {
    expect(new RequestError("http", { subject: "https://rule34.xxx/", status: 503 }).message).toBe("http https://rule34.xxx/ 503");
  });

  test("leaves out what it wasn't given", () => {
    expect(new RequestError("network").message).toBe("network");
  });

  test("keeps its subject and status", () => {
    const requestError = new RequestError("http", { subject: "1", status: 404 });

    expect([requestError.subject, requestError.status]).toEqual(["1", 404]);
  });

  test("keeps its cause", () => {
    const cause = new TypeError("offline");

    expect(new RequestError("network", { cause }).cause).toBe(cause);
  });
});
