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
    lean: false,
    sort: { created: -1 },
  };

  return PostSchema.paginate({}, options);
}

async function deletePost(postId) {
  return PostSchema.deleteOne({ _id: postId }).catch((err) => {
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

  return CommentSchema.paginate({ _id: postId }, options);
}

module.exports = {
  createPost,
  getPostById,
  getPosts,
  deletePost,
  addCommentToPost,
  getPostcomments,
};
