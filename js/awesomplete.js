/* eslint-disable new-cap */
class AwesompleteWrapper {
  constructor() {
    document.querySelectorAll("textarea").forEach((textarea) => {
      this.addAwesompleteToInput(textarea);
    });
  }

  /**
   * @param {HTMLTextAreaElement} input
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
        this.insertSuggestion(awesomplete.input, decodeEntities(suggestion.value));
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
    fetch(`https://rule34.xxx/autocomplete.php?q=${prefix}`)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status);
      })
      .then((suggestions) => {
        awesomplete.list = JSON.parse(suggestions);
      }).catch(() => {
      });
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @param {String} suggestion
   */
  insertSuggestion(input, suggestion) {
    const firstHalf = input.value.slice(0, input.selectionStart);
    const secondHalf = input.value.slice(input.selectionStart);
    const firstHalfWithPrefixRemoved = firstHalf.replace(/(?:^|\s)(-?)\S+$/, " $1");
    const result = removeExtraWhiteSpace(`${firstHalfWithPrefixRemoved}${suggestion} ${secondHalf} `);
    const newSelectionStart = firstHalfWithPrefixRemoved.length + suggestion.length + 1;

    input.value = `${result} `.replace(/^\s+/, "");
    input.selectionStart = newSelectionStart;
    input.selectionEnd = newSelectionStart;
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
