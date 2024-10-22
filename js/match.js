/* eslint-disable max-classes-per-file */
class PostTags {
  /**
   * @type {String}
  */
  id;
  /**
   * @type {Set.<String>}
   */
  set;
  /**
   * @type {String[]}
   */
  array;

  /**
   * @param {String} id
   * @param {String} tags
   */
  constructor(id, tags) {
    this.id = id;
    this.create(tags);
  }

  /**
   * @param {String} tags
   */
  create(tags) {
    this.array = removeExtraWhiteSpace(tags)
      .split(" ");
    this.set = new Set(this.array);
  }
}

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
   * @param {PostTags} postTags
   * @returns {Boolean}
   */
  matches(postTags) {
    if (postTags.set.has(this.value)) {
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
   * @param {PostTags} postTags
   * @returns {Boolean}
   */
  matches(postTags) {
    if (postTags.array.some(tag => this.regex.test(tag))) {
      return !this.negated;
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
   * @param {PostTags} postTags
   * @returns {Boolean}
   */
  matches(postTags) {
    const metadata = FavoriteMetadata.allMetadata.get(postTags.id);

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
 * @param {PostTags} postTags
 * @returns {Boolean}
 */
function postTagsMatchSearch(searchCommand, postTags) {
  if (searchCommand.isEmpty) {
    return true;
  }

  if (!postTagsMatchAllRemainingSearchTags(searchCommand.remainingSearchTags, postTags)) {
    return false;
  }
  return postTagsMatchAllOrGroups(searchCommand.orGroups, postTags);
}

/**
 * @param {SearchTag[]} remainingSearchTags
 * @param {PostTags} postTags
 * @returns {Boolean}
 */
function postTagsMatchAllRemainingSearchTags(remainingSearchTags, postTags) {
  for (const searchTag of remainingSearchTags) {
    if (!searchTag.matches(postTags)) {
      return false;
    }
  }
  return true;
}

/**
 * @param {SearchTag[][]} orGroups
 * @param {PostTags} postTags
 * @returns {Boolean}
 */
function postTagsMatchAllOrGroups(orGroups, postTags) {
  for (const orGroup of orGroups) {
    if (!atLeastOnePostTagIsInOrGroup(orGroup, postTags)) {
      return false;
    }
  }
  return true;
}

/**
 * @param {SearchTag[]} orGroup
 * @param {PostTags} postTags
 * @returns {Boolean}
 */
function atLeastOnePostTagIsInOrGroup(orGroup, postTags) {
  for (const orTag of orGroup) {
    if (orTag.matches(postTags)) {
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
