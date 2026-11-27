import { LIGHTBOX_COMMAND_DEFINITIONS, LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxMoreMenu, LightboxMoreMenuProps } from "@/core/features/lightbox/overlay/lightbox_more_menu";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import { createKeyBindings } from "@/testing/key_bindings";

const LIGHTBOX_COMMANDS = Object.keys(LIGHTBOX_COMMAND_DEFINITIONS) as LightboxCommand[];

interface SetupOptions {
  isZoomed?: boolean;
  canZoom?: boolean;
  canMute?: boolean;
}

function setup({ isZoomed = false, canZoom = false, canMute = false }: SetupOptions = {}): {
  lightboxMoreMenu: HTMLElement;
  handlers: LightboxMoreMenuProps["handlers"];
  onOpenChange: (isOpen: boolean) => void;
} {
  const handlers = { openPostPage: vi.fn(), download: vi.fn(), openOriginal: vi.fn(), toggleZoom: vi.fn(), toggleMute: vi.fn() };
  const onOpenChange = vi.fn();
  const { result: lightboxMoreMenu } = render(document, () => h(LightboxMoreMenu, {
    handlers,
    lightboxKeyBindings: new Signal(createKeyBindings(LIGHTBOX_COMMANDS, { download: ["d", "x"] })),
    lightboxZoom: { isZoomed: new Signal(isZoomed), canZoom: new Signal(canZoom) },
    muted: new Signal(false),
    canMute: new Signal(canMute),
    onOpenChange
  }));

  document.body.append(lightboxMoreMenu);
  return { lightboxMoreMenu, handlers, onOpenChange };
}

function listMenuItems(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("[role^=menuitem]")];
}

function describeMenuItems(): Array<Array<string | null>> {
  return listMenuItems().map(item => [item.textContent, item.getAttribute("aria-disabled"), item.getAttribute("aria-checked")]);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("LightboxMoreMenu", () => {
  test("keeps the post page and file actions in the more menu, with their shortcuts", () => {
    const { lightboxMoreMenu, handlers } = setup();

    lightboxMoreMenu.click();
    const listed = describeMenuItems();

    listMenuItems()[1].click();
    expect(listed).toEqual([
      ["Post Page", null, null],
      ["DownloadD", null, null],
      ["Original File", null, null],
      ["Zoom", "true", "false"]
    ]);
    expect(handlers.download).toHaveBeenCalledOnce();
  });

  test("enables zoom when it can zoom, and checks it while zoomed", () => {
    const canZoom = setup({ canZoom: true });

    canZoom.lightboxMoreMenu.click();
    const whenCanZoom = describeMenuItems()[3];

    document.body.replaceChildren();
    setup({ isZoomed: true }).lightboxMoreMenu.click();
    expect([whenCanZoom, describeMenuItems()[3]]).toEqual([["Zoom", null, "false"], ["Zoom", null, "true"]]);
  });

  test("lists mute in the more menu only when it can mute", () => {
    const { lightboxMoreMenu } = setup({ canMute: true });

    lightboxMoreMenu.click();
    const mute = listMenuItems().at(-1)!;

    expect([mute.textContent, mute.getAttribute("aria-checked")]).toEqual(["Mute", "false"]);
  });

  test("reports opening and closing", () => {
    const { lightboxMoreMenu, onOpenChange } = setup();

    lightboxMoreMenu.click();
    lightboxMoreMenu.click();
    expect(vi.mocked(onOpenChange).mock.calls).toEqual([[true], [false]]);
  });
});
