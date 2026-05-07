const MIRROR_STYLES: (keyof CSSStyleDeclaration)[] = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "wordSpacing",
  "tabSize",
  "whiteSpace",
  "wordWrap",
  "overflowWrap",
  "boxSizing"
];

type SuggestionFn = (value: string, cursorPosition: number) => string;

export class GhostAutocomplete {
  private readonly textarea: HTMLTextAreaElement;
  private readonly getSuggestion: SuggestionFn;
  private readonly acceptKeys: string[];
  private readonly overlay: HTMLDivElement;
  private currentSuggestion: string = "";
  private currentCompletionStart: number = 0;
  private focused: boolean = false;

  constructor(
    textarea: HTMLTextAreaElement,
    getSuggestion: SuggestionFn,
    acceptKeys: string[] = ["Tab"]
  ) {
    this.textarea = textarea;
    this.getSuggestion = getSuggestion;
    this.acceptKeys = acceptKeys;
    this.overlay = document.createElement("div");
    this.setup();
  }

  public clear(): void {
    this.currentSuggestion = "";
    this.overlay.replaceChildren();
    this.textarea.style.background = "";
    this.textarea.style.caretColor = "";
  }

  private setup(): void {
    console.warn("[GhostAutocomplete] setup() called");

    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      overflow: hidden;
      white-space: pre-wrap;
      color: transparent;
      box-sizing: border-box;
    `;

    const parent = this.textarea.parentElement;

    console.warn("[GhostAutocomplete] textarea parent:", parent);

    if (parent !== null) {
      parent.style.position = "relative";
      parent.insertBefore(this.overlay, this.textarea);
      console.warn("[GhostAutocomplete] overlay inserted into DOM");
    }

    this.syncOverlayStyles();
    this.bindEvents();
  }

  private syncOverlayStyles(): void {
    const computed = window.getComputedStyle(this.textarea);

    for (const prop of MIRROR_STYLES) {
      (this.overlay.style as unknown as Record<string, string>)[prop as string] = computed[prop] as string;
    }

    const borderTop = parseFloat(computed.borderTopWidth) || 0;
    const borderLeft = parseFloat(computed.borderLeftWidth) || 0;

    this.overlay.style.top = `${this.textarea.offsetTop + borderTop}px`;
    this.overlay.style.left = `${this.textarea.offsetLeft + borderLeft}px`;
    this.overlay.style.width = `${this.textarea.clientWidth}px`;
    this.overlay.style.height = `${this.textarea.clientHeight}px`;
  }

  private bindEvents(): void {
    this.textarea.addEventListener("input", () => this.update());
    this.textarea.addEventListener("keydown", (e) => this.onKeyDown(e));
    this.textarea.addEventListener("scroll", () => this.syncScroll());
    this.textarea.addEventListener("focus", () => {
      this.focused = true;
    });
    this.textarea.addEventListener("blur", () => {
      this.focused = false;
      this.clear();
    });

    const resizeObserver = new ResizeObserver(() => this.syncOverlayStyles());

    resizeObserver.observe(this.textarea);
  }

  private update(): void {
    const value = this.textarea.value;
    const cursor = this.textarea.selectionStart ?? value.length;
    const suggestion = this.getSuggestion(value, cursor);

    this.currentSuggestion = suggestion;
    this.currentCompletionStart = cursor;

    if (suggestion === "") {
      this.overlay.replaceChildren();
      this.textarea.style.background = "";
      this.textarea.style.caretColor = "";
      return;
    }

    const before = document.createTextNode(value.slice(0, cursor));
    const ghostSpan = document.createElement("span");

    ghostSpan.textContent = suggestion;
    ghostSpan.style.color = "rgba(128, 128, 128, 0.7)";

    this.overlay.replaceChildren(before, ghostSpan);

    if (this.focused) {
      this.textarea.style.background = "transparent";
      this.textarea.style.caretColor = "auto";
    }
    this.syncScroll();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.currentSuggestion === "") {
      return;
    }

    if (this.acceptKeys.includes(e.key)) {
      e.preventDefault();
      this.accept();
    } else if (e.key === "Escape") {
      this.clear();
    }
  }

  private accept(): void {
    const value = this.textarea.value;
    const triggerText = value.slice(0, this.currentCompletionStart);
    const lastSlashIndex = triggerText.lastIndexOf("/");
    const replaceStart = lastSlashIndex === -1 ? this.currentCompletionStart : lastSlashIndex;
    const after = value.slice(this.currentCompletionStart);

    this.textarea.value = value.slice(0, replaceStart) + this.currentSuggestion.trim() + after;
    const newCursor = replaceStart + this.currentSuggestion.trim().length;

    this.textarea.setSelectionRange(newCursor, newCursor);
    this.clear();
    this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private syncScroll(): void {
    this.overlay.scrollTop = this.textarea.scrollTop;
    this.overlay.scrollLeft = this.textarea.scrollLeft;
  }
}
