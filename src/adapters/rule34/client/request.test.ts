import { describe, expect, test } from "vitest";
import { request, send } from "@/adapters/rule34/client/request";
import { Rule34Error } from "@/adapters/rule34/client/error";

const URL = "https://rule34.xxx/index.php";

function respondWith(status: number): () => Promise<Response> {
  return () => Promise.resolve(new Response("body", { status }));
}

function failNetwork(): Promise<Response> {
  return Promise.reject(new TypeError("offline"));
}

describe("send", () => {
  test("hands back any response the host gives", async() => {
    expect((await send(respondWith(404), URL)).status).toBe(404);
  });

  test("names a network failure", async() => {
    await expect(send(failNetwork, URL)).rejects.toMatchObject({ reason: "network", subject: URL });
  });
});

describe("request", () => {
  test("hands back an ok response", async() => {
    expect(await (await request(respondWith(200), URL)).text()).toBe("body");
  });

  test("names a refused response by its status", async() => {
    await expect(request(respondWith(503), URL)).rejects.toMatchObject({ reason: "http", status: 503 });
  });

  test("names a network failure", async() => {
    await expect(request(failNetwork, URL)).rejects.toBeInstanceOf(Rule34Error);
  });
});
