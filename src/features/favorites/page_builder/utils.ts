import {MainSidebar} from "./sidebar";
import {waitForDOMToLoad} from "../../../utils/dom/dom";

export async function moveHeaderToSidebar(): Promise<void> {
  await waitForDOMToLoad();
  const header = document.getElementById("header");

  if (header !== null) {
    MainSidebar.contentContainer.insertAdjacentElement("afterbegin", header);
  }
}
