const express = require("express");

const router = express.Router();
const postService = require("../services/post.service");
const authorize = require("../services/authorization.service");
const roles = require("../config/roles");

function getPosts(req, res, next) {
  let { page } = req.query;

  if (page === undefined || Number.isNaN(page)) {
    page = 1;
  }

  return postService
    .getPosts(page)
    .then((posts) => res.json(posts))
    .catch((err) => next(err));
}

function findPost(req, res, next) {}

function createPost(req, res, next) {
  const user = req.auth;
  const postToCreate = req.body;
  postToCreate.postedBy = user.sub;

  postService
    .createPost(postToCreate)
    .then((createdPost) =>
      createdPost
        ? res.json(createdPost)
        : res.status(400).json({ error: "Could not create post" })
    )
    .catch((err) => next(err));
}

function deletePost(req, res, next) {
  const { sub, role } = req.auth;
  const { postId, commentId } = req.params;

  let deleteResult;
  if (role.indexOf(roles.Admin) >= 0) {
    deleteResult = postService.deletePost(postId);
  } else {
    deleteResult = postService.deletePost(postId, sub);
  }

  return deleteResult
    .then((result) => (result ? res.sendStatus(200) : res.sendStatus(400)))
    .catch((err) => next(err));
}

function getPostcomments(req, res, next) {
  let { page } = req.query;

  if (page === undefined || Number.isNaN(page)) {
    page = 1;
  }

  if (req.params.postId) {
    return postService
      .getPostcomments(req.params.postId, page)
      .then((result) =>
        result
          ? res.json(result)
          : res.status(400).json({ error: "Could not get posts" })
      )
      .catch((err) => next(err));
  }

  return res.status(400).json({ error: "post id not found in path" });
}

function addCommentToPost(req, res, next) {
  if (req.params.postId) {
    const user = req.auth;
    const commentToCreate = req.body;
    commentToCreate.postedBy = user.sub;

    return postService
      .addCommentToPost(req.params.postId, req.body)
      .then((result) =>
        result
          ? res.json(result)
          : res.status(400).json({ error: "Could not add post" })
      )
      .catch((err) => next(err));
  }

  return res.status(400).json({ error: "post id not found in path" });
}

function deleteCommentFromPost(req, res, next) {
  const { sub, role } = req.auth;
  const { postId, commentId } = req.params;

  let deleteResult;
  if (role.indexOf(roles.Admin) >= 0) {
    deleteResult = postService.deleteComment(postId, commentId);
  } else {
    deleteResult = postService.deleteComment(postId, commentId, sub);
  }

  return deleteResult
    .then((result) => (result ? res.sendStatus(200) : res.sendStatus(400)))
    .catch((err) => next(err));
}
// routes
router.get("/", authorize(roles.User), getPosts);
router.post("/", authorize(roles.User), createPost);
router.delete("/:postId", authorize(roles.User), deletePost);
router.get("/:postId/comments", authorize(roles.User), getPostcomments);
router.post("/:postId/comments", authorize(roles.User), addCommentToPost);
router.delete(
  "/:postId/comments/:commentId",
  authorize(roles.User),
  deleteCommentFromPost
);
module.exports = router;
