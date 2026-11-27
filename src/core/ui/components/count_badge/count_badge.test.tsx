import { CountBadge, CountBadgeClass } from "@/core/ui/components/count_badge/count_badge";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import COUNT_BADGE_CSS from "@/core/ui/components/count_badge/count_badge.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("CountBadge", () => {
  test("shows the count", () => {
    const { result } = render(document, () => <CountBadge count={new Signal(3)} />);

    expect([result.hidden, result.textContent]).toEqual([false, "3"]);
  });

  test("hides at zero and returns when the count rises", () => {
    const count = new Signal(0);
    const { result } = render(document, () => <CountBadge count={count} />);

    expect(result.hidden).toBe(true);
    count.value = 1;
    expect(result.hidden).toBe(false);
  });

  test("defaults to the medium size", () => {
    const readSize = (size?: "medium" | "large"): string | undefined => {
      return render(document, () => <CountBadge count={new Signal(1)} size={size} />).result.dataset.size;
    };

    expect([readSize(), readSize("large")]).toEqual(["medium", "large"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(CountBadgeClass, COUNT_BADGE_CSS);
  });
});
