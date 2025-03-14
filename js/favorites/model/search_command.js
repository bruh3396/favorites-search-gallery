class SearchCommand {
  /**
   * @param {String} tag
   * @returns {SearchTag}
   */
  static createSearchTag(tag) {
    if (MetadataSearchTag.regex.test(tag)) {
      return new MetadataSearchTag(tag);
    }

    if (tag.includes("*")) {
      return new WildcardSearchTag(tag);
    }
    return new SearchTag(tag);
  }

  /**
   * @param {String[]} tags
   * @returns {SearchTag[]}
   */
  static createSearchTagGroup(tags) {
    const uniqueTags = new Set();
    const searchTags = [];

    for (const tag of tags) {
      if (!uniqueTags.has(tag)) {
        uniqueTags.add(tag);
        searchTags.push(SearchCommand.createSearchTag(tag));
      }
    }
    return searchTags;
  }

  /**
   * @param {SearchTag[]} searchTags
   */
  static sortByLeastExpensive(searchTags) {
    searchTags.sort((a, b) => {
      return a.finalCost - b.finalCost;
    });
  }

  /** @type {SearchTag[][]} */
  orGroups;
  /** @type {SearchTag[]} */
  remainingSearchTags;
  /** @type {Boolean} */
  isEmpty;

  /**
   * @param {String} searchQuery
   */
  constructor(searchQuery) {
    this.isEmpty = Utils.isEmptyString(searchQuery);
    this.orGroups = [];
    this.remainingSearchTags = [];

    if (this.isEmpty) {
      return;
    }
    const {orGroups, remainingSearchTags} = Utils.extractTagGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => SearchCommand.createSearchTagGroup(orGroup));
    this.remainingSearchTags = SearchCommand.createSearchTagGroup(remainingSearchTags);
    this.optimizeSearchCommand();
  }

  optimizeSearchCommand() {
    for (const orGroup of this.orGroups) {
      SearchCommand.sortByLeastExpensive(orGroup);
    }
    SearchCommand.sortByLeastExpensive(this.remainingSearchTags);
    this.orGroups.sort((a, b) => {
      return a.length - b.length;
    });
  }

  /**
   * @param {Post[]} posts
   * @returns {Post[]}
   */
  getSearchResults(posts) {
    if (this.isEmpty) {
      return posts;
    }
    const results = [];

    for (const post of posts) {
      if (this.matches(post)) {
        results.push(post);
        post.setAsMatchedByMostRecentSearch(true);
      } else {
        post.setAsMatchedByMostRecentSearch(false);
      }
    }
    return results;
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matches(post) {
    if (!this.matchesAllRemainingSearchTags(post)) {
      return false;
    }
    return this.matchesAllOrGroups(post);
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesAllRemainingSearchTags(post) {
    for (const searchTag of this.remainingSearchTags) {
      if (!searchTag.matches(post)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesAllOrGroups(post) {
    for (const orGroup of this.orGroups) {
      if (!this.atLeastOnePostTagIsInOrGroup(orGroup, post)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {SearchTag[]} orGroup
   * @param {Post} post
   * @returns {Boolean}
   */
  atLeastOnePostTagIsInOrGroup(orGroup, post) {
    for (const orTag of orGroup) {
      if (orTag.matches(post)) {
        return true;
      }
    }
    return false;
  }
}
