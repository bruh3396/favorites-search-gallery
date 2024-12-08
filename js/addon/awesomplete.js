class AwesompleteWrapper {
  static preferences = {
    savedSearchSuggestions: "savedSearchSuggestions"
  };

  /**
   * @type {Boolean}
   */
  static get disabled() {
    return !onFavoritesPage();
  }

  /**
   * @type {Boolean}
   */
  showSavedSearchSuggestions;

  constructor() {
    if (AwesompleteWrapper.disabled) {
      return;
    }
    this.initializeFields();
    this.insertHTML();
    this.addAwesompleteToInputs();
  }

  initializeFields() {
    this.showSavedSearchSuggestions = getPreference(AwesompleteWrapper.preferences.savedSearchSuggestions, false);
  }

  insertHTML() {
    createFavoritesOption(
      "show-saved-search-suggestions",
      "Saved Suggestions",
      "Show saved search suggestions in autocomplete dropdown",
      this.showSavedSearchSuggestions,
      (event) => {
        this.showSavedSearchSuggestions = event.target.checked;
        setPreference(AwesompleteWrapper.preferences.savedSearchSuggestions, event.target.checked);
      },
      false
    );
  }

  addAwesompleteToInputs() {
    document.querySelectorAll("textarea").forEach((textarea) => {
      this.addAwesompleteToInput(textarea);
    });
    document.querySelectorAll("input").forEach((input) => {
      if (input.hasAttribute("needs-autocomplete")) {
        this.addAwesompleteToInput(input);
      }
    });
  }

  /**
   * @param {HTMLElement} input
   */
  addAwesompleteToInput(input) {
    const awesomplete = new Awesomplete_(input, {
      minChars: 1,
      list: [],
      filter: (suggestion, _) => {
        // eslint-disable-next-line new-cap
        return Awesomplete_.FILTER_STARTSWITH(suggestion.value, this.getCurrentTag(awesomplete.input));
      },
      sort: false,
      item: (suggestion, tags) => {
        const html = tags.trim() === "" ? suggestion.label : suggestion.label.replace(RegExp(Awesomplete_.$.regExpEscape(tags.trim()), "gi"), "<mark>$&</mark>");
        return Awesomplete_.$.create("li", {
          innerHTML: html,
          "aria-selected": "false",
          className: `tag-type-${suggestion.type}`
        });
      },
      replace: (suggestion) => {
        insertSuggestion(awesomplete.input, removeSavedSearchPrefix(decodeEntities(suggestion.value)));
      }
    });

    input.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Tab":
          if (!awesomplete.isOpened || awesomplete.suggestions.length === 0) {
            return;
          }
          awesomplete.next();
          awesomplete.select();
          event.preventDefault();
          break;

        case "Escape":
          hideAwesomplete(input);
          break;

        default:
          break;
      }
    });

    input.oninput = () => {
      this.populateAwesompleteList(input.id, this.getCurrentTagWithHyphen(input), awesomplete);
    };
  }

  getSavedSearchesForAutocompleteList(inputId, prefix) {
    if (onMobileDevice() || !this.showSavedSearchSuggestions || inputId !== "favorites-search-box") {
      return [];
    }
    return getSavedSearchesForAutocompleteList(prefix);
  }

  /**
   * @param {String} inputId
   * @param {String} prefix
   * @param {Awesomplete_} awesomplete
   */
  populateAwesompleteList(inputId, prefix, awesomplete) {
    if (prefix.trim() === "") {
      return;
    }
    const savedSearchSuggestions = this.getSavedSearchesForAutocompleteList(inputId, prefix);

    prefix = prefix.replace(/^-/, "");

    fetch(`https://ac.rule34.xxx/autocomplete.php?q=${prefix}`)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status);
      })
      .then((suggestions) => {

        const mergedSuggestions = addCustomTagsToAutocompleteList(JSON.parse(suggestions), prefix);

        awesomplete.list = mergedSuggestions.concat(savedSearchSuggestions);
      });
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns {String}
   */
  getCurrentTag(input) {
    return this.getLastTag(input.value.slice(0, input.selectionStart));
  }

  /**
   * @param {String} searchQuery
   * @returns {String}
   */
  getLastTag(searchQuery) {
    const lastTag = searchQuery.match(/[^ -][^ ]*$/);
    return lastTag === null ? "" : lastTag[0];
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns {String}
   */
  getCurrentTagWithHyphen(input) {
    return this.getLastTagWithHyphen(input.value.slice(0, input.selectionStart));
  }

  /**
   * @param {String} searchQuery
   * @returns {String}
   */
  getLastTagWithHyphen(searchQuery) {
    const lastTag = searchQuery.match(/[^ ]*$/);
    return lastTag === null ? "" : lastTag[0];
  }
}

const awesomplete = new AwesompleteWrapper();
