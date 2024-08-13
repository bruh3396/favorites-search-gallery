/* eslint-disable new-cap */
class AwesompleteWrapper {
  constructor() {
    document.querySelectorAll("textarea").forEach((textarea) => {
      this.addAwesompleteToTextarea(textarea);
    });
  }

  /**
   * @param {HTMLTextAreaElement} textarea
   * @returns
   */
  addAwesompleteToTextarea(textarea) {
    if (textarea === null) {
      return;
    }
    const awesomplete = new Awesomplete_(textarea, {
      minChars: 1,
      list: [],
      filter: (suggestion, input) => {
        return Awesomplete_.FILTER_STARTSWITH(suggestion.value, this.getLastTag(input));
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
        awesomplete.input.value = `${awesomplete.input.value.match(/^(.+ )?[\s-]*|/)[0] + decodeEntities(suggestion.value)} `;
      }
    });

    textarea.oninput = (event) => {
      this.populateAwesompleteFromPrefix(this.getLastTag(event.target.value), awesomplete);
    };
  }

  /**
   * @param {String} prefix
   * @param {Awesomplete_} awesomplete
   * @returns
   */
  populateAwesompleteFromPrefix(prefix, awesomplete) {
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
   * @param {String} searchQuery
   * @returns {String}
   */
  getLastTag(searchQuery) {
    const lastTag = searchQuery.match(/[^ -][^ ]*$/);
    return lastTag === null ? "" : lastTag[0];
  }
}

const awesomplete = new AwesompleteWrapper();
