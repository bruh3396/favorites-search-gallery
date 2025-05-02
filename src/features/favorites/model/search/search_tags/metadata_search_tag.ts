// class MetadataSearchTag extends SearchTag {
//   /**
//    * @param {String} tag
//    * @returns {Boolean}
//    */
//   static is(tag) {
//     return MetadataSearchExpression.regex.test(tag);
//   }

//   /** @type {MetadataSearchExpression} */
//   expression;

//   /** @type {Number} */
//   get cost() {
//     return 0;
//   }

//   /**
//    * @param {String} searchTag
//    */
//   constructor(searchTag) {
//     super(searchTag);
//     this.expression = new MetadataSearchExpression(this.value);
//   }

//   /**
//    * @param {Post} post
//    * @returns {Boolean}
//    */
//   matches(post) {
//     return post.metadata.satisfiesExpression(this.expression) !== this.negated;
//   }
// }
