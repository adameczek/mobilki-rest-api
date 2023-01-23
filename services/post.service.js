const _ = require("underscore");
const PostSchema = require("../models/post");
const CommentSchema = require("../models/comment");

const nPerPage = 25;
async function createPost(post) {
  post.created = Date.now();

  return new PostSchema(post).save().catch((err) => console.error(err));
}

async function getPostById(id) {
  return PostSchema.findOne({ _id: id }).exec();
}

async function getPosts(page) {
  const options = {
    page: page,
    limit: nPerPage,
    sort: { created: -1 },
    options: { populate: ["last10comments", "postedBy"] },
  };

  return PostSchema.paginate({}, options);
}

async function deletePost(postId, userId) {
  const query = _.omit({ _id: postId, postedBy: userId }, (value) =>
    _.isUndefined(value)
  );

  return PostSchema.deleteOne(query)
    .exec()
    .then((result) => {
      if (result.deletedCount === 1) {
        CommentSchema.deleteMany({ post: postId }).exec();
      }

      return result;
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

async function addCommentToPost(postId, comment) {
  comment.created = Date.now();
  comment.post = postId;
  return new CommentSchema(comment).save().catch((err) => {
    console.error(err);
    throw err;
  });
}

async function getPostcomments(postId, page) {
  const options = {
    page: page,
    limit: nPerPage,
    sort: { created: -1 },
  };

  return CommentSchema.paginate({ post: postId }, options);
}

async function deleteComment(postId, commentId, userId) {
  const query = _.omit(
    { _id: commentId, post: postId, postedBy: userId },
    (value) => _.isUndefined(value)
  );

  const result = await CommentSchema.deleteOne(query)
    .exec()
    .catch((err) => {
      console.error(err);
      throw err;
    });

  return result.deletedCount === 1;
}

module.exports = {
  createPost,
  getPostById,
  getPosts,
  deletePost,
  addCommentToPost,
  getPostcomments,
  deleteComment,
};
