import { describe, expect, test } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34RemoteFavoriteActions } from "@/adapters/rule34/ports/remote_favorite_actions/remote_favorite_actions";
import { advanceAndSettle } from "@/testing/async";

interface Setup {
  actions: Rule34RemoteFavoriteActions;
  scheduler: MemoryScheduler;
}

function setup(addAnswer = "3"): Setup {
  const scheduler = new MemoryScheduler();
  const actions = new Rule34RemoteFavoriteActions({
    fetch: () => Promise.resolve(new Response(addAnswer)),
    scheduler,
    randomSource: new MemoryRandomSource([1])
  });
  return { actions, scheduler };
}

describe("Rule34RemoteFavoriteActions", () => {
  test("reports the site's answer to an add", async() => {
    expect(await setup("1").actions.add("7")).toBe("alreadyAdded");
  });

  test("reports an add cancelled by a later remove", async() => {
    const { actions, scheduler } = setup();
    const first = actions.add("1");
    const second = actions.add("2");

    await actions.remove("2");
    await advanceAndSettle(scheduler, 1_000);
    expect(await first).toBe("added");
    expect(await second).toBe("cancelled");
  });

  test("reports a sent remove as removed and one cancelled by a later add as cancelled", async() => {
    const { actions, scheduler } = setup();
    const first = actions.remove("1");
    const second = actions.remove("2");

    await actions.add("2");
    await advanceAndSettle(scheduler, 1_000);
    expect(await first).toBe("removed");
    expect(await second).toBe("cancelled");
  });
});
