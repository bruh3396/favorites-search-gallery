import { describe, expect, test } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34RemoteFavoriteActions } from "@/adapters/rule34/ports/remote_favorite_actions/remote_favorite_actions";

function createActions(addAnswer = "3"): Rule34RemoteFavoriteActions {
  return new Rule34RemoteFavoriteActions({
    fetch: () => Promise.resolve(new Response(addAnswer)),
    scheduler: new MemoryScheduler(),
    randomSource: new MemoryRandomSource([1])
  });
}

describe("Rule34RemoteFavoriteActions", () => {
  test("reports the site's answer to an add", async() => {
    expect(await createActions("1").add("7")).toBe("alreadyAdded");
  });

  test("reports an add cancelled by a later remove", async() => {
    const actions = createActions();
    const first = actions.add("1");
    const second = actions.add("2");

    await actions.remove("2");
    expect(await first).toBe("added");
    expect(await second).toBe("cancelled");
  });

  test("reports a sent remove as removed and one cancelled by a later add as cancelled", async() => {
    const actions = createActions();
    const first = actions.remove("1");
    const second = actions.remove("2");

    await actions.add("2");
    expect(await first).toBe("removed");
    expect(await second).toBe("cancelled");
  });
});
