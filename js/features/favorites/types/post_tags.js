class PostTags {
  /** @type {Set<String>} */
  get originalTagSet() {
    return this.tagSet.difference(this.additionalTagSet);
  }

  /** @type {String} */
  get originalTagString() {
    return Utils.convertToTagString(this.originalTagSet);
  }

  /** @type {String} */
  get additionalTagString() {
    return Utils.convertToTagString(this.additionalTagSet);
  }

  /** @type {String} */
  id;
  /** @type {Set<String>} */
  tagSet;
  /** @type {Set<String>} */
  additionalTagSet;

  /**
   * @param {PostData} postData
   */
  constructor(postData) {
    this.id = postData.id;
    this.initializeTagSets(postData.tags);
  }

  /**
   * @param {String} tags
   */
  initializeTagSets(tags) {
    this.tagSet = Utils.convertToTagSet(`${this.id} ${tags}`);
    this.additionalTagSet = Utils.convertToTagSet(TagModifier.tagModifications.get(this.id) || "");

    if (this.additionalTagSet.size > 0) {
      this.combineOriginalAndAdditionalTagSets();
    }
  }

  combineOriginalAndAdditionalTagSets() {
    const union = this.originalTagSet.union(this.additionalTagSet);

    this.tagSet = new Set(Array.from(union).sort());
  }

  /**
   * @param {String} newTags
   * @returns {String}
   */
  addAdditionalTags(newTags) {
    const newTagsSet = Utils.convertToTagSet(newTags).difference(this.tagSet);

    if (newTagsSet.size > 0) {
      this.additionalTagSet = this.additionalTagSet.union(newTagsSet);
      this.combineOriginalAndAdditionalTagSets();
    }
    return this.additionalTagString;
  }

  /**
   * @param {String} tagsToRemove
   * @returns {String}
   */
  removeAdditionalTags(tagsToRemove) {
    const tagsToRemoveSet = Utils.convertToTagSet(tagsToRemove).intersection(this.additionalTagSet);

    if (tagsToRemoveSet.size > 0) {
      this.tagSet = this.tagSet.difference(tagsToRemoveSet);
      this.additionalTagSet = this.additionalTagSet.difference(tagsToRemoveSet);
    }
    return this.additionalTagString;
  }

  resetAdditionalTags() {
    if (this.additionalTagSet.size === 0) {
      return;
    }
    this.additionalTagSet = new Set();
    this.combineOriginalAndAdditionalTagSets();
  }
}
