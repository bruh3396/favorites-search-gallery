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

class WildCardSearchTag extends SearchTag {
  static unmatchableRegex = /^\b$/;

  /**
   * @type {RegExp}
  */
  regex;

  /**
   * @param {String} searchTag
   * @param {Boolean} inOrGroup
   */
  constructor(searchTag, inOrGroup) {
    super(searchTag, inOrGroup);
    this.regex = this.createWildcardRegex();
  }

  /**
   * @returns {RegExp}
   */
  createWildcardRegex() {
    try {
      return new RegExp(`^${this.value.replaceAll(/\*/g, ".*")}$`);
    } catch {
      return WildCardSearchTag.unmatchableRegex;
    }
  }

  /**
   * @param {ThumbNode} thumbNode
   * @returns {Boolean}
   */
  matches(thumbNode) {
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

/**
 * @param {String} searchTag
 * @param {Boolean} inOrGroup
 * @returns {SearchTag}
 */
function createSearchTag(searchTag, inOrGroup) {
  if (MetadataSearchTag.regex.test(searchTag)) {
    return new MetadataSearchTag(searchTag, inOrGroup);
  }

  if (searchTag.includes("*")) {
    return new WildCardSearchTag(searchTag, inOrGroup);
  }
  return new SearchTag(searchTag, inOrGroup);
}

class SearchCommand {
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
    this.orGroups = [];
    this.remainingSearchTags = [];
    this.isEmpty = searchQuery.trim() === "";

    if (this.isEmpty) {
      return;
    }
    const {orGroups, remainingSearchTags} = extractTagGroups(searchQuery);

    for (const orGroup of orGroups) {
      this.orGroups.push(orGroup.map(searchTag => createSearchTag(searchTag, true)));
    }
    this.remainingSearchTags = remainingSearchTags.map(searchTag => createSearchTag(searchTag, false));
  }
}

/**
 * @param {SearchCommand} searchCommand
 * @param {ThumbNode} thumbNode
 * @returns {Boolean}
 */
function matchesSearch(searchCommand, thumbNode) {
  if (searchCommand.isEmpty) {
    return true;
  }

  if (!matchesAllRemainingSearchTags(searchCommand.remainingSearchTags, thumbNode)) {
    return false;
  }
  return matchesAllOrGroups(searchCommand.orGroups, thumbNode);
}

/**
 * @param {SearchTag[]} remainingSearchTags
 * @param {ThumbNode} thumbNode
 * @returns {Boolean}
 */
function matchesAllRemainingSearchTags(remainingSearchTags, thumbNode) {
  for (const searchTag of remainingSearchTags) {
    if (!searchTag.matches(thumbNode)) {
      return false;
    }
  }
  return true;
}

/**
 * @param {SearchTag[][]} orGroups
 * @param {ThumbNode} thumbNode
 * @returns {Boolean}
 */
function matchesAllOrGroups(orGroups, thumbNode) {
  for (const orGroup of orGroups) {
    if (!atLeastOneThumbNodeTagIsInOrGroup(orGroup, thumbNode)) {
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
function atLeastOneThumbNodeTagIsInOrGroup(orGroup, thumbNode) {
  for (const orTag of orGroup) {
    if (orTag.matches(thumbNode)) {
      return true;
    }
  }
  return false;
}

/**
 * @param {String} searchTag
 * @param {String[]} tags
 * @returns {Boolean}
 */
function tagsMatchWildcardSearchTag(searchTag, tags) {
  const wildcardRegex = new RegExp(`^${searchTag.replaceAll(/\*/g, ".*")}$`);
  return tags.some(tag => wildcardRegex.test(tag));
}
