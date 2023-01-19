const express = require("express");

const router = express.Router();
const userService = require("../services/user.service");
const authorize = require("../services/authorization.service");
const roles = require("../config/roles");
const user = require("../models/user");
// routes
router.post("/authenticate", authenticate); // public route
router.get("/", authorize(roles.Admin), getAll); // admin only
router.post("/", createUser);
router.get("/:id", authorize(roles.User), getById); // all authenticated users
module.exports = router;

function authenticate(req, res, next) {
  console.log(req.body);
  userService
    .authenticate(req.body)
    .then((user) =>
      user
        ? res.json(user)
        : res.status(400).json({ message: "Username or password is incorrect" })
    )
    .catch((err) => next(err));
}

function getAll(req, res, next) {
  userService
    .getAll()
    .then((users) => res.json(users))
    .catch((err) => next(err));
}

function getById(req, res, next) {
  const currentUser = req.auth;
  const { id } = req.params;
  console.log(currentUser);
  console.log(id);
  // only allow admins to access other user records
  if (id !== currentUser.sub && !currentUser.role.includes(roles.Admin)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  userService
    .getById(req.params.id)
    .then((user) => (user ? res.json(user) : res.sendStatus(404)))
    .catch((err) => next(err));
}

function createUser(req, res, next) {
  userService
    .createUser(req.body)
    .then((user) =>
      user ? res.json(user) : res.status(400).json("Could not create user!")
    )
    .catch((err) => next(err));
}
