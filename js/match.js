/* eslint-disable max-classes-per-file */
class PostTags {
  /**
   * @type {Set.<String>}
   */
  set;
  /**
   * @type {String[]}
   */
  array;

  /**
   * @param {String} tags
   */
  constructor(tags) {
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
  static unmatchableRegex = /^\b$/;

  /**
   * @type {String}
  */
  value;
  /**
   * @type {Boolean}
  */
  isNegated;
  /**
   * @type {Boolean}
  */
  isWildcard;
  /**
   * @type {RegExp}
  */
  wildcardRegex;

  /**
   * @param {String} searchTag
   */
  constructor(searchTag) {
    this.isNegated = searchTag.startsWith("-");
    this.isWildcard = searchTag.includes("*");
    this.value = this.isNegated ? searchTag.substring(1) : searchTag;
    this.wildcardRegex = this.createWildcardRegex();
  }

  /**
   * @returns {RegExp}
   */
  createWildcardRegex() {
    if (!this.isWildcard) {
      return SearchTag.unmatchableRegex;
    }
    try {
      return new RegExp(`^${this.value.replaceAll(/\*/g, ".*")}$`);
    } catch {
      return SearchTag.unmatchableRegex;
    }
  }
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
      this.orGroups.push(orGroup.map(searchTag => new SearchTag(searchTag)));
    }
    this.remainingSearchTags = remainingSearchTags.map(searchTag => new SearchTag(searchTag));
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
    if (!postTagsMatchSearchTag(searchTag, postTags, false)) {
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
    if (postTagsMatchSearchTag(orTag, postTags, true)) {
      return true;
    }
  }
  return false;
}

/**
 * @param {SearchTag} searchTag
 * @param {PostTags} postTags
 * @param {Boolean} inOrGroup
 * @returns {Boolean}
 */
function postTagsMatchSearchTag(searchTag, postTags, inOrGroup) {
  const isNegated = inOrGroup ? false : searchTag.isNegated;

  if (searchTag.isWildcard && postTagsMatchWildcardSearchTag(searchTag, postTags.array)) {
    return !isNegated;
  }

  if (postTags.set.has(searchTag.value)) {
    return !isNegated;
  }
  return isNegated;
}

/**
 * @param {SearchTag} searchTag
 * @param {String[]} tags
 * @returns {Boolean}
 */
function postTagsMatchWildcardSearchTag(searchTag, tags) {
  return tags.some(tag => searchTag.wildcardRegex.test(tag));
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
