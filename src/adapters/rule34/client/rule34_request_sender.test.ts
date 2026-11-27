import { describe, expect, test } from "vitest";
import { Rule34Error } from "@/adapters/rule34/client/rule34_error";
import { sendRule34Request } from "@/adapters/rule34/client/rule34_request_sender";

const URL = "https://rule34.xxx/index.php";

function respondWith(status: number): () => Promise<Response> {
  return () => Promise.resolve(new Response("body", { status }));
}

function failNetwork(): Promise<Response> {
  return Promise.reject(new TypeError("offline"));
}

describe("sendRule34Request", () => {
  test("hands back an ok response", async() => {
    expect(await (await sendRule34Request(respondWith(200), URL)).text()).toBe("body");
  });

  test("names a refused response by its status", async() => {
    await expect(sendRule34Request(respondWith(503), URL)).rejects.toMatchObject({ reason: "http", status: 503 });
  });

  test("hands back a refused response when told not to throw on it", async() => {
    expect((await sendRule34Request(respondWith(404), URL, { throwsHttpErrors: false })).status).toBe(404);
  });

  test("names a network failure", async() => {
    await expect(sendRule34Request(failNetwork, URL)).rejects.toMatchObject({ reason: "network", subject: URL });
    await expect(sendRule34Request(failNetwork, URL, { throwsHttpErrors: false })).rejects.toBeInstanceOf(Rule34Error);
  });
});
