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
    const awesomplete = new Awesomplete(textarea, {
      minChars: 1,
      list: [],
      filter: (suggestion, input) => {
        return Awesomplete.FILTER_STARTSWITH(suggestion.value, this.getLastTag(input));
      },
      sort: false,
      item: (suggestion, tags) => {
        return Awesomplete.ITEM(suggestion, this.getLastTag(tags));
      },
      replace: (suggestion) => {
        awesomplete.input.value = `${awesomplete.input.value.match(/^(.+ )?[\s-]*|/)[0] + suggestion.value} `;
      }
    });

    textarea.oninput = (event) => {
      this.populateAwesompleteFromPrefix(this.getLastTag(event.target.value), awesomplete);
    };
  }

  /**
   * @param {String} prefix
   * @param {Awesomplete} awesomplete
   * @returns
   */
  populateAwesompleteFromPrefix(prefix, awesomplete) {
    if (prefix === null) {
      return;
    }
    fetch(`https://rule34.xxx/autocomplete.php?q=${prefix}`)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status);
      })
      .then((suggestions) => {
        awesomplete.list = JSON.parse(suggestions);
      }).catch((error) => {
        console.error(error);
      });
  }

  /**
   * @param {String} searchQuery
   * @returns {String}
   */
  getLastTag(searchQuery) {
    const lastTag = searchQuery.match(/[^ -][^ ]*$/);
    return lastTag === null ? null : lastTag[0];
  }
}

const awesomplete = new AwesompleteWrapper();
