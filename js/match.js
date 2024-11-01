/* eslint-disable max-classes-per-file */
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
   * @param {Boolean} inOrGroup
   */
  constructor(searchTag, inOrGroup) {
    this.negated = inOrGroup ? false : searchTag.startsWith("-");
    this.value = this.negated ? searchTag.substring(1) : searchTag;
  }

  /**
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matches(thumbNode) {
    if (thumbNode.tagSet.has(this.value)) {
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
  regex;
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
   * @param {Boolean} inOrGroup
   */
  constructor(searchTag, inOrGroup) {
    super(searchTag, inOrGroup);
    this.regex = this.createWildcardRegex();
    this.equivalentToStartsWith = WildcardSearchTag.startsWithRegex.test(searchTag);
    this.startsWithPrefix = this.value.slice(0, -1);
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
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matches(thumbNode) {
    if (this.equivalentToStartsWith) {
      return this.matchesPrefix(thumbNode);
    }
    return this.matchesWildcard(thumbNode);
  }

  /**
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matchesPrefix(thumbNode) {
    for (const tag of thumbNode.tagSet.values()) {
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
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matchesWildcard(thumbNode) {
    for (const tag of thumbNode.tagSet.values()) {
      if (this.regex.test(tag)) {
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
  constructor(searchTag, inOrGroup) {
    super(searchTag, inOrGroup);
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
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matches(thumbNode) {
    const metadata = FavoriteMetadata.allMetadata.get(thumbNode.id);

    if (metadata === undefined) {
      return false;
    }

    if (metadata.satisfiesExpression(this.expression)) {
      return !this.negated;
    }
    return this.negated;
  }
}

class SearchCommand {
  /**
   * @param {String} tag
   * @param {Boolean} inOrGroup
   * @returns {SearchTag}
   */
  static createSearchTag(tag, inOrGroup) {
    if (MetadataSearchTag.regex.test(tag)) {
      return new MetadataSearchTag(tag, inOrGroup);
    }

    if (tag.includes("*")) {
      return new WildcardSearchTag(tag, inOrGroup);
    }
    return new SearchTag(tag, inOrGroup);
  }

  /**
   * @param {String[]} tags
   * @param {Boolean} isOrGroup
   * @returns {SearchTag[]}
   */
  static createSearchTagGroup(tags, isOrGroup) {
    const uniqueTags = new Set();
    const searchTags = [];

    for (const tag of tags) {
      if (uniqueTags.has(tag)) {
        continue;
      }
      uniqueTags.add(tag);
      searchTags.push(SearchCommand.createSearchTag(tag, isOrGroup));
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
    const {orGroups, remainingSearchTags} = extractTagGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => SearchCommand.createSearchTagGroup(orGroup, true));
    this.remainingSearchTags = SearchCommand.createSearchTagGroup(remainingSearchTags, false);
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
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matches(thumbNode) {
    if (this.isEmpty) {
      return true;
    }

    if (!this.matchesAllRemainingSearchTags(thumbNode)) {
      return false;
    }
    return this.matchesAllOrGroups(thumbNode);
  }

  /**
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matchesAllRemainingSearchTags(thumbNode) {
    for (const searchTag of this.remainingSearchTags) {
      if (!searchTag.matches(thumbNode)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matchesAllOrGroups(thumbNode) {
    for (const orGroup of this.orGroups) {
      if (!this.atLeastOneThumbNodeTagIsInOrGroup(orGroup, thumbNode)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {SearchTag[]} orGroup
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  atLeastOneThumbNodeTagIsInOrGroup(orGroup, thumbNode) {
    for (const orTag of orGroup) {
      if (orTag.matches(thumbNode)) {
        return true;
      }
    }
    return false;
  }
}
