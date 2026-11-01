import { describe, expect, test } from "vitest";
import { sendOkRule34Request, sendRule34Request } from "@/adapters/rule34/client/rule34_request_sender";
import { Rule34Error } from "@/adapters/rule34/client/rule34_error";

const URL = "https://rule34.xxx/index.php";

function respondWith(status: number): () => Promise<Response> {
  return () => Promise.resolve(new Response("body", { status }));
}

function failNetwork(): Promise<Response> {
  return Promise.reject(new TypeError("offline"));
}

describe("sendRule34Request", () => {
  test("hands back any response the host gives", async() => {
    expect((await sendRule34Request(respondWith(404), URL)).status).toBe(404);
  });

  test("names a network failure", async() => {
    await expect(sendRule34Request(failNetwork, URL)).rejects.toMatchObject({ reason: "network", subject: URL });
  });
});

describe("sendOkRule34Request", () => {
  test("hands back an ok response", async() => {
    expect(await (await sendOkRule34Request(respondWith(200), URL)).text()).toBe("body");
  });

  test("names a refused response by its status", async() => {
    await expect(sendOkRule34Request(respondWith(503), URL)).rejects.toMatchObject({ reason: "http", status: 503 });
  });

  test("names a network failure", async() => {
    await expect(sendOkRule34Request(failNetwork, URL)).rejects.toBeInstanceOf(Rule34Error);
  });
});
