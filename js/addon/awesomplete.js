class AwesompleteWrapper {
  /**
   * @type {Boolean}
   */
  static get disabled() {
    return !Flags.onFavoritesPage;
  }
  /**
   * @type {Boolean}
   */
  showSavedSearchSuggestions;

  constructor() {
    if (AwesompleteWrapper.disabled) {
      return;
    }
    this.showSavedSearchSuggestions = Preferences.savedSearchSuggestions.value;
    this.insertHTML();
    this.addAwesompleteToInputs();
  }

  insertHTML() {
    Utils.createFavoritesOption(
      "show-saved-search-suggestions",
      "Saved Suggestions",
      "Show saved search suggestions in autocomplete dropdown",
      this.showSavedSearchSuggestions,
      (event) => {
        this.showSavedSearchSuggestions = event.target.checked;
        Preferences.savedSearchSuggestions.set(event.target.checked);
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
        return Awesomplete_.FILTER_STARTSWITH(suggestion.value, this.getCurrentTag(awesomplete.input).replaceAll("*", ""));
      },
      sort: false,
      item: (suggestion, tags) => {
        const html = Utils.isEmptyString(tags) ? suggestion.label : suggestion.label.replace(RegExp(Awesomplete_.$.regExpEscape(tags.trim()), "gi"), "<mark>$&</mark>");
        return Awesomplete_.$.create("li", {
          innerHTML: html,
          "aria-selected": "false",
          className: `tag-type-${suggestion.type}`
        });
      },
      replace: (suggestion) => {
        this.insertSuggestion(awesomplete.input, Utils.removeSavedSearchPrefix(decodeEntities(suggestion.value)));
        awesomplete.input.dispatchEvent(new CustomEvent("updatedProgrammatically"));
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
          Utils.hideAwesomplete(input);
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
    if (Flags.onMobileDevice || !this.showSavedSearchSuggestions || inputId !== Utils.mainSearchBoxId) {
      return [];
    }
    return Utils.getSavedSearchesForAutocompleteList(prefix);
  }

  /**
   * @param {String} inputId
   * @param {String} prefix
   * @param {Awesomplete_} awesomplete
   */
  populateAwesompleteList(inputId, prefix, awesomplete) {
    if (Utils.isEmptyString(prefix)) {
      return;
    }
    const savedSearchSuggestions = this.getSavedSearchesForAutocompleteList(inputId, prefix);

    prefix = prefix.replace(/^[-*]*/, "");

    fetch(`https://ac.rule34.xxx/autocomplete.php?q=${prefix}`)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status);
      })
      .then((suggestions) => {

        const mergedSuggestions = Utils.addCustomTagsToAutocompleteList(JSON.parse(suggestions), prefix);

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
    const lastTag = searchQuery.match(/[^ -]\S*$/);
    return lastTag === null ? "" : lastTag[0];
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns {String}
   */
  getCurrentTagWithHyphen(input) {
    const selectionStart = input.selectionStart || undefined;
    return this.getLastTagWithHyphen(input.value.slice(0, selectionStart));
  }

  /**
   * @param {String} searchQuery
   * @returns {String}
   */
  getLastTagWithHyphen(searchQuery) {
    const lastTag = searchQuery.match(/[^ ]*$/);
    return lastTag === null ? "" : lastTag[0];
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @param {String} suggestion
   */
  insertSuggestion(input, suggestion) {
    const initialSelectionStart = input.selectionStart || undefined;
    const cursorAtEnd = initialSelectionStart === input.value.length;
    const firstHalf = input.value.slice(0, initialSelectionStart);
    const secondHalf = input.value.slice(initialSelectionStart);
    const firstHalfWithPrefixRemoved = firstHalf.replace(/(\s?)(-?\*?)\S+$/, "$1$2");
    const combinedHalves = Utils.removeExtraWhiteSpace(`${firstHalfWithPrefixRemoved}${suggestion} ${secondHalf}`);
    const result = cursorAtEnd ? `${combinedHalves} ` : combinedHalves;
    const selectionStart = firstHalfWithPrefixRemoved.length + suggestion.length + 1;

    input.value = result;
    input.selectionStart = selectionStart;
    input.selectionEnd = selectionStart;
  }
}
