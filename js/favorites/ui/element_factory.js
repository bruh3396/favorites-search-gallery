class ElementFactory {

  static stopErrors = {};
  /**
   * @param {ElementTemplate} template
   */
  static createButton(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    parent.insertAdjacentHTML(template.position, `<button id="${template.id}" title="${template.title}" data-action="${template.action}">${template.textContent}</button>`);

    const button = document.getElementById(template.id);

    if (button === null || !(button instanceof HTMLButtonElement)) {
      return;
    }
    button.onclick = () => {
      button.dispatchEvent(new CustomEvent(template.handler, {
        bubbles: true
      }));
    };
  }

  /**
   * @param {ElementTemplate} template
   */
  static createCheckbox(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    const checkbox = document.createElement("input");

    checkbox.id = template.id;
    checkbox.type = "checkbox";
    checkbox.dataset.action = template.action;
    parent.insertAdjacentElement(template.position, checkbox);

    const preferenceName = Utils.convertDashedToCamelCase(template.id);

    checkbox.checked = Boolean(Utils.getPreference(preferenceName, template.defaultValue));

    checkbox.addEventListener("change", () => {
      if (template.savePreference) {
        Utils.setPreference(preferenceName, checkbox.checked);
      }
      checkbox.dispatchEvent(new CustomEvent(template.handler, {
        bubbles: true,
        detail: checkbox.checked
      }));
    });
    FavoritesUIController.registerCheckboxHotkey(template.hotkey, checkbox);

    if (template.invokeActionOnCreation) {
      checkbox.dispatchEvent(new CustomEvent(template.handler, {
        bubbles: true,
        detail: checkbox.checked
      }));
    }
  }

  /**
   * @param {ElementTemplate} template
   */
  static createCheckboxOption(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    const labelId = `${template.id}-label`;

    parent
      .insertAdjacentHTML(
        template.position,
        `<div id="${template.id}-container">
            <label id="${labelId}" class="checkbox" title="${template.title}">
              <span> ${template.textContent}</span>
              ${template.hotkey === "" ? "" : `<span class="option-hint"> (${template.hotkey})</span>`}
            </label>
          </div>`
      );
    template.parentId = labelId;
    template.position = "afterbegin";
    ElementFactory.createCheckbox(template);
  }

  /**
   * @param {ElementTemplate} template
   */
  static createSelect(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }

    const optionsHTML = template.optionPairs
      .map(([value, text]) => `<option value="${value}">${text}</option>`)
      .join("\n");
    const selectHTML = `
      <select id="${template.id}" title="${template.title}" data-action="${template.action}">
        ${optionsHTML}
      </select>`;

    parent.insertAdjacentHTML(template.position, selectHTML);
    const select = document.getElementById(template.id);

    if (select === null || !(select instanceof HTMLSelectElement)) {
      return;
    }
    const preferenceName = Utils.convertDashedToCamelCase(template.id);

    select.value = Utils.getPreference(preferenceName, template.optionPairs[0][0]);

    if (template.invokeActionOnCreation) {
      select.dispatchEvent(new CustomEvent(template.handler, {
        bubbles: true,
        detail: select.value
      }));
    }

    select.onchange = () => {
      select.dispatchEvent(new CustomEvent(template.handler, {
        bubbles: true,
        detail: select.value
      }));
      Utils.setPreference(preferenceName, select.value);
    };
  }

  /**
   * @param {ElementTemplate} template
   */
  static createToggleSwitch(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    const toggleSwitchId = `${template.id}-toggle-switch`;

    parent
      .insertAdjacentHTML(
        template.position,
        `<div id="${template.id}-toggle-switch-container">
          <label id="${toggleSwitchId}" class="toggle-switch" title="${template.title}">
            <span class="slider round"></span>
            <span class="toggle-switch-label"> ${template.textContent}</span>
          </label>
        </div>`
      );
    template.position = "afterbegin";
    template.parentId = toggleSwitchId;
    ElementFactory.createCheckbox(template);
    const checkbox = document.getElementById(template.id);

    if (checkbox !== null) {
      checkbox.style.width = "0";
      checkbox.style.height = "0";
      checkbox.style.opacity = "0";
    }
  }

  /**
   * @param {ElementTemplate} template
   */
  static createNumberComponent(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    const preferenceName = Utils.convertDashedToCamelCase(template.id);
    const numberComponentId = `${template.id}-number`;

    template.defaultValue = Utils.getPreference(preferenceName, template.defaultValue);
    const html = `
      <span class="number" id="${numberComponentId}">
        <hold-button class="number-arrow-down" pollingtime="${template.pollingTime}">
          <span>&lt;</span>
        </hold-button>
        <input id="${template.id}" data-action="${template.action}" type="number" min="${template.min}" max="${template.max}" step="${template.step}" defaultValue="${Utils.getPreference(preferenceName, template.defaultValue)}">
        <hold-button class="number-arrow-up" pollingtime="${template.pollingTime}">
          <span>&gt;</span>
        </hold-button>
      </span>
    `;

    parent.insertAdjacentHTML(template.position, html);
    const element = document.getElementById(numberComponentId);

    if (element === null) {
      return;
    }
    const numberComponent = new NumberComponent(element);
    const numberInput = numberComponent.input;

    if (numberInput === null) {
      return;
    }

    numberInput.value = String(template.defaultValue);
    numberInput.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true
    }));

    if (template.invokeActionOnCreation) {
      numberInput.dispatchEvent(new CustomEvent(template.handler, {
        bubbles: true,
        detail: numberInput
      }));
    }

    numberInput.onchange = () => {
      numberInput.dispatchEvent(new CustomEvent(template.handler, {
        bubbles: true,
        detail: numberInput
      }));
      Utils.setPreference(preferenceName, parseFloat(numberInput.value));
    };
  }
}
