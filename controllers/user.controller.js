const express = require("express");

const router = express.Router();
const userService = require("../services/user.service");
const authorize = require("../services/authorization.service");
const roles = require("../config/roles");

function authenticate(req, res, next) {
  userService
    .authenticate(req.body)
    .then((user) =>
      user
        ? res.json(user)
        : res.status(400).json({ message: "Niespodziewany błąd nastąpił" })
    )
    .catch((err) => next(err));
}

function getAll(req, res, next) {
  let { page } = { ...req.query.page };

  if (page === undefined || Number.isNaN(page)) {
    page = 1;
  }

  userService
    .getAll(page)
    .then((users) => res.json(users))
    .catch((err) => next(err));
}

function findUser(req, res, next) {
  const currentUser = req.auth;
  console.log(currentUser);
  console.log(req.query);
  // only allow admins to access other user records

  let user;
  if (req.query.email) {
    if (
      req.query.email !== currentUser.email &&
      !currentUser.role.includes(roles.Admin)
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    user = userService.getByEmail(req.query.email);
  } else if (req.query.id) {
    if (
      req.query.id !== currentUser.sub &&
      !currentUser.role.includes(roles.Admin)
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    user = userService.getById(req.query.id);
  } else {
    return res
      .status(400)
      .json({ message: "Please provide request query param 'email' or 'id'" });
  }

  return user
    .then((userFromDB) =>
      userFromDB ? res.json(userFromDB) : res.sendStatus(404)
    )
    .catch((err) => {
      console.log(err);
      next(err);
    });
}

function createUser(req, res, next) {
  userService
    .createUser(req.body)
    .then((createdUser) =>
      createdUser
        ? res.json(createdUser)
        : res.status(400).json({ error: "Could not create user!" })
    )
    .catch((err) => next(err));
}

function addRoles(req, res, next) {
  const newRole = req.body.role;
  return userService
    .addRole(req.params.id, newRole)
    .then((result) => res.json({ success: result }))
    .catch((error) => next(error));
}

function updateUser(req, res, next) {
  const { role, sub } = req.auth;

  if (
    role.includes(roles.Admin) ||
    (role.includes(roles.User) && sub === req.params.id)
  ) {
    return userService
      .updateUser(req.params.id, req.body)
      .then((result) => res.json(result))
      .catch((err) => next(err));
  }

  return res.status(401).json({
    error: "Użytkownik nie jest uprawniony do korzystania z tej metody",
  });
}

function getAllRoles(req, res, next) {
  return res.json(roles);
}

function getUserPosts(req, res, next) {
  let { page } = { ...req.query.page };

  if (page === undefined || Number.isNaN(page)) {
    page = 1;
  }

  userService
    .getUserPosts(req.params.id, page)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(400).json({ error: "nastąpil niespodziewany błąd" })
    );
}

function searchForUsers(req, res, next) {
  const { query } = req.body;
  let { page } = { ...req.query.page };

  if (page === undefined || Number.isNaN(page)) {
    page = 1;
  }

  userService
    .searchForUsers(query, page)
    .then((result) => res.json(result))
    .catch((error) => res.status(400).json({ error: error.message }));
}

// routes
router.post("/authenticate", authenticate); // public route
router.get("/", authorize(roles.User), getAll);
router.post("/", createUser);
router.get("/user", authorize(roles.User), findUser); // all authenticated users
router.put("/user/:id", authorize(roles.User), updateUser);
router.post("/user/:id/roles", authorize(roles.Admin), addRoles);
router.get("/roles", authorize(roles.User), getAllRoles);
router.get("/user/:id/posts", authorize(roles.User), getUserPosts);
router.post("/search", authorize(roles.User), searchForUsers);
module.exports = router;
