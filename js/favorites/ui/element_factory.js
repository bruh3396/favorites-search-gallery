class ElementFactory {
  /**
   * @param {ElementTemplate<MouseEvent>} template
   */
  static createButton(template) {
    const parent = document.getElementById(template.parentId);
    const eventEmitter = template.event;

    if (parent === null) {
      return;
    }
    parent.insertAdjacentHTML(template.position, `<button id="${template.id}" title="${template.title}">${template.textContent}</button>`);
    const button = document.getElementById(template.id);

    if (button === null || !(button instanceof HTMLButtonElement)) {
      return;
    }

    if (eventEmitter !== null) {
      button.onclick = (event) => {
        eventEmitter.emit(event);
      };
      button.oncontextmenu = template.rightClickEnabled ? (event) => {
        eventEmitter.emit(event);
      } : null;
    }
  }

  /**
   * @param {ElementTemplate<Boolean>} template
   */
  static createCheckbox(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    const checkbox = document.createElement("input");
    const emitEvent = () => {
      if (template.event !== null) {
        template.event.emit(checkbox.checked);
      }
    };
    const savePreference = () => {
      if (template.savePreference && template.preference !== null) {
        template.preference.set(checkbox.checked);
      }
    };

    checkbox.id = template.id;
    checkbox.type = "checkbox";
    parent.insertAdjacentElement(template.position, checkbox);

    if (template.hotkey !== "" && template.event !== null) {
      Events.global.keydown.on(async(event) => {
        if (!event.isHotkey || event.key.toLowerCase() !== template.hotkey.toLowerCase()) {
          return;
        }
        const inGallery = await Utils.inGallery();

        if (inGallery) {
          return;
        }
        checkbox.checked = !checkbox.checked;
        savePreference();
        emitEvent();
      });
    }

    if (template.preference === null) {
      checkbox.checked = template.defaultValue ? template.defaultValue : false;
    } else {
      checkbox.checked = template.preference.value;
    }

    checkbox.addEventListener("change", () => {
      savePreference();
      emitEvent();
    });

    if (template.invokeActionOnCreation) {
      Events.global.postProcess.on(() => {
        emitEvent();
      });
    }
  }

  /**
   * @param {ElementTemplate<Boolean>} template
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
   * @param {ElementTemplate<String | Number>} template
   */
  static createSelect(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    const optionsHTML = Array.from(Object.entries(template.optionPairs))
      .map(([value, text]) => `<option id="${template.id}-${value}" value="${value}">${text}</option>`)
      .join("\n");
    const selectHTML = `
      <select id="${template.id}" title="${template.title}">
        ${optionsHTML}
      </select>`;

    parent.insertAdjacentHTML(template.position, selectHTML);
    const select = document.getElementById(template.id);

    if (select === null || !(select instanceof HTMLSelectElement)) {
      return;
    }
    const emitEvent = () => {
      if (template.event !== null) {
        template.event.emit(select.value);
      }

      if (template.preference !== null) {
        template.preference.set(select.value);
      }
    };

    if (template.preference === null) {
      select.value = String(Object.values(template.optionPairs)[0]);
    } else {
      select.value = String(template.preference.value);
    }

    if (template.invokeActionOnCreation) {
      Events.global.postProcess.on(() => {
        emitEvent();
      });
    }

    select.onchange = () => {
      emitEvent();

      if (template.preference !== null) {
        template.preference.set(select.value);
      }
    };
  }

  /**
   * @param {ElementTemplate<Boolean>} template
   */
  static createToggleSwitch(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    const toggleSwitchId = `${template.id}-toggle-switch`;
    const switchHTML = `
    <label id="${toggleSwitchId}" class="toggle-switch" title="${template.title}">
        <span class="slider round"></span>
        <span class="toggle-switch-label"> ${template.textContent}</span>
    </label>`;
    const switchContainerHTML = `<div id="${template.id}-toggle-switch-container">${switchHTML}</div>`;
    const html = template.useContainer ? switchContainerHTML : switchHTML;

    parent.insertAdjacentHTML(template.position, html);
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
   * @param {ElementTemplate<Number>} template
   */
  static createNumberComponent(template) {
    const parent = document.getElementById(template.parentId);

    if (parent === null) {
      return;
    }
    const numberComponentId = `${template.id}-number`;
    const defaultValue = template.preference === null ? 1 : template.preference.value;

    const html = `
      <span class="number" id="${numberComponentId}">
        <hold-button class="number-arrow-down" pollingtime="${template.pollingTime}">
          <span>&lt;</span>
        </hold-button>
        <input id="${template.id}" type="number" min="${template.min}" max="${template.max}" step="${template.step}" defaultValue="${defaultValue}">
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
    const emitEvent = () => {
      const value = parseFloat(numberInput.value);

      if (template.event !== null) {
        template.event.emit(value);
      }

      if (template.preference !== null) {
        template.preference.set(value);
      }
    };

    if (numberInput === null) {
      return;
    }

    numberInput.value = String(defaultValue);
    numberInput.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true
    }));

    if (template.invokeActionOnCreation) {
      Events.global.postProcess.on(() => {
        emitEvent();
      });
    }

    numberInput.onchange = () => {
      emitEvent();
      template.preference?.set(parseFloat(numberInput.value));
    };
  }
}
