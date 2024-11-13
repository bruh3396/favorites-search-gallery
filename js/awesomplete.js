/* eslint-disable new-cap */
class AwesompleteWrapper {
  /**
   * @type {Boolean}
  */
  static get disabled() {
    return !onFavoritesPage();
  }
  constructor() {
    if (AwesompleteWrapper.disabled) {
      return;
    }
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
        insertSuggestion(awesomplete.input, decodeEntities(suggestion.value));
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
      this.populateAwesompleteList(this.getCurrentTag(input), awesomplete);
    };
  }

  /**
   * @param {String} prefix
   * @param {Awesomplete_} awesomplete
   */
  populateAwesompleteList(prefix, awesomplete) {
    if (prefix.trim() === "") {
      return;
    }
    fetch(`https://ac.rule34.xxx/autocomplete.php?q=${prefix}`)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status);
      })
      .then((suggestions) => {

        const mergedSuggestions = mergeOfficialTagsWithCustomTags(JSON.parse(suggestions), prefix);

        awesomplete.list = mergedSuggestions;
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
}

const awesomplete = new AwesompleteWrapper();
