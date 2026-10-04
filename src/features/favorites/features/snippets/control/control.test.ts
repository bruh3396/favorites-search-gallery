import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SnippetAction } from "@/features/favorites/features/snippets/types/types";
import { SnippetControl } from "@/features/favorites/features/snippets/control/control";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";
import { createIntents } from "@/features/favorites/features/snippets/testing/snippets";

interface Setup {
  control: SnippetControl;
  shell: SnippetShell;
  calls: string[];
}

function setup(editing: boolean = false): Setup {
  const shell = new SnippetShell();
  const { intents, calls } = createIntents(editing);
  const control = new SnippetControl(shell, intents);

  shell.list.append(createRow("fruits", "use", ["moveToTop", "edit", "requestDelete"]), createRow("veg", null, ["cancelDelete", "delete"]));
  document.body.append(shell.filter, shell.list, shell.footer);
  calls.splice(0);
  return { control, shell, calls };
}

function createRow(name: string, action: SnippetAction | null, buttons: SnippetAction[]): HTMLElement {
  const row = document.createElement("div");

  row.dataset.snippetName = name;
  row.append(...buttons.map(buttonAction => {
    const button = document.createElement("button");

    button.dataset.snippetAction = buttonAction;
    button.append(document.createElement("span"));
    return button;
  }));

  if (action !== null) {
    row.dataset.snippetAction = action;
  }
  return row;
}

function type(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new Event("input"));
}

function press(field: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, cancelable: true });

  field.dispatchEvent(event);
  return event;
}

function queryRow(shell: SnippetShell, name: string): HTMLElement {
  return shell.list.querySelector<HTMLElement>(`[data-snippet-name="${name}"]`) as HTMLElement;
}

function queryButton(shell: SnippetShell, name: string, action: string): HTMLElement {
  return queryRow(shell, name).querySelector<HTMLElement>(`[data-snippet-action="${action}"]`) as HTMLElement;
}

beforeEach(() => {
  vi.stubGlobal("fetch", (): Promise<Response> => Promise.resolve(new Response("[]")));
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("SnippetControl", () => {
  test("uses a row's snippet when the row is clicked", () => {
    const { shell, calls } = setup();

    queryRow(shell, "fruits").click();
    expect(calls).toEqual(["use:fruits"]);
  });

  test.each([
    ["fruits", "moveToTop", "moveToTop:fruits"],
    ["fruits", "edit", "edit:fruits"],
    ["fruits", "requestDelete", "requestDelete:fruits"],
    ["veg", "cancelDelete", "cancelDelete"],
    ["veg", "delete", "delete:veg"]
  ])("answers a click on %s's %s button with only %s", (name, action, call) => {
    const { shell, calls } = setup();

    queryButton(shell, name, action).click();
    expect(calls).toEqual([call]);
  });

  test("fires the button, not the row, on a click inside the button", () => {
    const { shell, calls } = setup();

    (queryButton(shell, "fruits", "edit").firstElementChild as HTMLElement).click();
    expect(calls).toEqual(["edit:fruits"]);
  });

  test("ignores a click on an untagged part of the list", () => {
    const { shell, calls } = setup();

    queryRow(shell, "veg").click();
    shell.list.click();
    expect(calls).toEqual([]);
  });

  test("saves the fields' name and query when save is clicked", () => {
    const { shell, calls } = setup();

    shell.nameField.value = "fruits";
    shell.queryField.value = "apple";
    shell.saveButton.click();
    expect(calls).toEqual(["save:fruits:apple"]);
  });

  test("asks for a query from the search results when results is clicked", () => {
    const { shell, calls } = setup();

    shell.resultsButton.click();
    expect(calls).toEqual(["fillQueryFromResults"]);
  });

  test("asks to cancel the edit when cancel is clicked", () => {
    const { shell, calls } = setup();

    shell.cancelButton.click();
    expect(calls).toEqual(["cancelEdit"]);
  });

  test("lowercases and underscores a typed name", () => {
    const { shell, calls } = setup();

    type(shell.nameField, "My Fruits");
    expect(shell.nameField.value).toBe("my_fruits");
    expect(calls).toEqual(["clearFailure"]);
  });

  test("keeps a typed name that is already clean", () => {
    const { shell } = setup();

    type(shell.nameField, "fruits");
    expect(shell.nameField.value).toBe("fruits");
  });

  test("reports a typed query", () => {
    const { shell, calls } = setup();

    type(shell.queryField, "apple");
    expect(calls).toEqual(["clearFailure"]);
  });

  test.each(["nameField", "queryField"] as const)("consumes Escape in %s when it cancels an edit", field => {
    const { shell, calls } = setup(true);

    expect(press(shell[field], "Escape").defaultPrevented).toBe(true);
    expect(calls).toEqual(["cancelEdit"]);
  });

  test("passes Escape through when nothing was being edited", () => {
    const { shell, calls } = setup(false);

    expect(press(shell.nameField, "Escape").defaultPrevented).toBe(false);
    expect(calls).toEqual(["cancelEdit"]);
  });

  test("ignores other keys in the editor", () => {
    const { shell, calls } = setup(true);

    expect(press(shell.nameField, "Enter").defaultPrevented).toBe(false);
    expect(calls).toEqual([]);
  });

  test("reports what is typed into the filter", () => {
    const { shell, calls } = setup();

    type(shell.filter.querySelector("input") as HTMLInputElement, "fru");
    expect(calls).toEqual(["filter:fru"]);
  });

  test.each([
    [1, "exportToFile"],
    [2, "deleteAll"]
  ])("makes action %i fire %s", (index, call) => {
    const { control, calls } = setup();

    control.actions[index].click();
    expect(calls).toEqual([call]);
  });

  test("imports the chosen file's contents from the import action", async() => {
    const { control, calls } = setup();
    const spy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(function choose(this: HTMLInputElement): void {
      Object.defineProperty(this, "files", { value: [new File(["[]"], "snippets.json")] });
      this.dispatchEvent(new Event("change"));
    });

    control.actions[0].click();
    await vi.waitFor(() => expect(calls).toEqual(["importFromFile:[]"]));
    spy.mockRestore();
  });
});
