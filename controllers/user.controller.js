const express = require("express");

const router = express.Router();
const userService = require("../services/user.service");
const authorize = require("../services/authorization.service");
const roles = require("../config/roles");

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
    .catch((err) => next(err));
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

// routes
router.post("/authenticate", authenticate); // public route
router.get("/", authorize(roles.User), getAll);
router.post("/", createUser);
router.get("/user", authorize(roles.User), findUser); // all authenticated users
module.exports = router;
