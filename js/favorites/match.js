class SearchTag {
  /**
   * @type {String}
   */
  value;
  /**
   * @type {Boolean}
   */
  negated;

  /**
   * @type {Number}
   */
  get cost() {
    return 0;
  }

  /**
   * @type {Number}
   */
  get finalCost() {
    return this.negated ? this.cost + 1 : this.cost;
  }

  /**
   * @param {String} searchTag
   */
  constructor(searchTag) {
    this.negated = searchTag.startsWith("-");
    this.value = this.negated ? searchTag.substring(1) : searchTag;
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matches(post) {
    if (post.tagSet.has(this.value)) {
      return !this.negated;
    }
    return this.negated;
  }
}

class WildcardSearchTag extends SearchTag {
  static unmatchableRegex = /^\b$/;
  static startsWithRegex = /^[^*]*\*$/;

  /**
   * @type {RegExp}
   */
  matchRegex;
  /**
   * @type {Boolean}
   */
  equivalentToStartsWith;
  /**
   * @type {String}
   */
  startsWithPrefix;

  /**
   * @type {Number}
   */
  get cost() {
    return this.equivalentToStartsWith ? 10 : 20;
  }

  /**
   * @param {String} searchTag
   */
  constructor(searchTag) {
    super(searchTag);
    this.matchRegex = this.createWildcardRegex();
    this.startsWithPrefix = this.value.slice(0, -1);
    this.equivalentToStartsWith = WildcardSearchTag.startsWithRegex.test(searchTag);
    this.matches = this.equivalentToStartsWith ? this.matchesPrefix : this.matchesWildcard;
  }

  /**
   * @returns {RegExp}
   */
  createWildcardRegex() {
    try {
      return new RegExp(`^${this.value.replaceAll(/\*/g, ".*")}$`);
    } catch {
      return WildcardSearchTag.unmatchableRegex;
    }
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesPrefix(post) {
    for (const tag of post.tagSet.values()) {
      if (tag.startsWith(this.startsWithPrefix)) {
        return !this.negated;
      }

      if (this.startsWithPrefix < tag) {
        break;
      }
    }
    return this.negated;
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesWildcard(post) {
    for (const tag of post.tagSet.values()) {
      if (this.matchRegex.test(tag)) {
        return !this.negated;
      }
    }
    return this.negated;
  }
}

class MetadataSearchTag extends SearchTag {
  static regex = /^-?(score|width|height|id)(:[<>]?)(\d+|score|width|height|id)$/;

  /**
   * @type {MetadataSearchExpression}
   */
  expression;

  /**
   * @type {Number}
   */
  get cost() {
    return 0;
  }

  /**
   * @param {String} searchTag
   * @param {Boolean} inOrGroup
   */
  constructor(searchTag) {
    super(searchTag);
    this.expression = this.createExpression(searchTag);
  }

  /**
   * @param {String} searchTag
   * @returns {MetadataSearchExpression}
   */
  createExpression(searchTag) {
    const extractedExpression = MetadataSearchTag.regex.exec(searchTag);
    return new MetadataSearchExpression(
      extractedExpression[1],
      extractedExpression[2],
      extractedExpression[3]
    );
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matches(post) {
    if (post.metadata.satisfiesExpression(this.expression)) {
      return !this.negated;
    }
    return this.negated;
  }
}

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
   * @param {Boolean} isOrGroup
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

  /**
   * @type {SearchTag[][]}
   */
  orGroups;
  /**
   * @type {SearchTag[]}
   */
  remainingSearchTags;
  /**
   * @type {Boolean}
   */
  isEmpty;

  /**
   * @param {String} searchQuery
   */
  constructor(searchQuery) {
    this.isEmpty = searchQuery.trim() === "";

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
   * @param {Post} post
   * @returns {Boolean}
   */
  matches(post) {
    if (this.isEmpty) {
      return true;
    }

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
