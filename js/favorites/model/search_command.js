class SearchCommand {
  /**
   * @param {String} tag
   * @returns {SearchTag}
   */
  static createSearchTag(tag) {
    if (MetadataSearchTag.is(tag)) {
      return new MetadataSearchTag(tag);
    }

    if (WildcardSearchTag.is(tag)) {
      return new WildcardSearchTag(tag);
    }

    if (AliasedSearchTag.is(tag)) {
      return new AliasedSearchTag(tag);
    }
    return new SearchTag(tag);
  }

  /**
   * @param {String[]} tags
   * @returns {SearchTag[]}
   */
  static createSearchTagGroup(tags) {
    /** @type {Set<String>} */
    const uniqueTags = new Set();
    /** @type {SearchTag[]} */
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

    if (this.isEmpty) {
      return;
    }
    const {orGroups, remainingSearchTags} = Utils.extractTagGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => SearchCommand.createSearchTagGroup(orGroup));
    this.remainingSearchTags = SearchCommand.createSearchTagGroup(remainingSearchTags);
    this.optimize();
    console.log(this);
  }

  /**
   * @param {Post[]} posts
   * @returns {Post[]}
   */
  getSearchResults(posts) {
    return this.isEmpty ? posts : posts.filter(post => this.matches(post));
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matches(post) {
    return this.matchesAllRemainingSearchTags(post) && this.matchesAllOrGroups(post);
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesAllRemainingSearchTags(post) {
    return this.remainingSearchTags.every(tag => tag.matches(post));
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesAllOrGroups(post) {
    return this.orGroups.every(orGroup => orGroup.some(tag => tag.matches(post)));
  }

  optimize() {
    this.simplifyOrGroupsWithOnlyOneTag();
    this.sortSearchTagsByLeastExpensive();
    this.sortOrGroupsByLength();
  }

  simplifyOrGroupsWithOnlyOneTag() {
    const orGroups = [];

    for (const orGroup of this.orGroups) {
      if (orGroup.length === 1) {
        this.remainingSearchTags.push(orGroup[0]);
      } else {
        orGroups.push(orGroup);
      }
    }
    this.orGroups = orGroups;
  }

  sortSearchTagsByLeastExpensive() {
    for (const tagGroup of this.orGroups) {
      SearchCommand.sortByLeastExpensive(tagGroup);
    }
    SearchCommand.sortByLeastExpensive(this.remainingSearchTags);
  }

  sortOrGroupsByLength() {
    this.orGroups.sort((a, b) => {
      return a.length - b.length;
    });
  }
}
