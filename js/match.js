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
      .split(" ")
      .sort();
    this.set = new Set(this.array);
  }
}

/**
 * @param {String} searchQuery
 * @returns {{orGroups: String[][], remainingSearchTags: String[], isEmptySearch: Boolean}}
 */
function getSearchCommand(searchQuery) {
  const {orGroups, remainingSearchTags} = extractTagGroups(searchQuery);
  return {
    orGroups,
    remainingSearchTags,
    isEmptySearch: searchQuery.trim() === ""
  };
}

/**
 * @param {{orGroups: String[][], remainingSearchTags: String[], isEmptySearch: Boolean}} searchCommand
 * @param {PostTags} postTags
 * @returns {Boolean}
 */
function postTagsMatchSearch(searchCommand, postTags) {
  if (searchCommand.isEmptySearch) {
    return true;
  }

  if (!postTagsMatchAllRemainingSearchTags(searchCommand.remainingSearchTags, postTags)) {
    return false;
  }
  return postTagsMatchAllOrGroups(searchCommand.orGroups, postTags);
}

/**
 * @param {String[]} remainingSearchTags
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
 * @param {String[][]} orGroups
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
 * @param {String[]} orGroup
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
 * @param {String} searchTag
 * @param {PostTags} postTags
 * @param {Boolean} inOrGroup
 * @returns {Boolean}
 */
function postTagsMatchSearchTag(searchTag, postTags, inOrGroup) {
  const isNegated = inOrGroup ? false : searchTag.startsWith("-");
  const isWildcard = searchTag.endsWith("*");

  searchTag = isWildcard ? searchTag.slice(0, -1) : searchTag;
  searchTag = isNegated ? searchTag.substring(1) : searchTag;
  const postTagsContainSearchTag = postTags.set.has(searchTag);

  if (postTagsContainSearchTag) {
    return !isNegated;
  }

  if (isWildcard && binarySearchStartsWith(searchTag, postTags.array)) {
    return !isNegated;
  }
  return isNegated;
}

/**
 * @param {String} target
 * @param {String[]} array
 * @returns {Boolean}
 */
function binarySearchStartsWith(target, array) {
  let left = 0;
  let right = array.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (array[mid].startsWith(target)) {
      return true;
    } else if (array[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return false;
}
