require("dotenv").config();
const jwt = require("jsonwebtoken");
const _ = require("underscore");
const UserSchema = require("../models/user");
const roles = require("../config/roles");

const nPerPage = 25;

async function authenticate({ email, password }) {
  try {
    const user = await UserSchema.findOne({ email: email })
      .select("+password")
      .exec();
    if (user) {
      const compareResponse = await user.comparePassword(password);
      console.log(compareResponse);

      const token = jwt.sign(
        {
          sub: user.id,
          role: user.role,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
        process.env.JWT_SECRET
      );
      delete user.password;
      return {
        user,
        token,
      };
    }
  } catch (err) {
    console.error(err);
  }
}

async function getAll(page) {
  const options = {
    page: page,
    limit: nPerPage,
    sort: { created: -1 },
    select: ["-role"],
  };

  return UserSchema.paginate({}, options);
}

async function getById(id) {
  return UserSchema.findOne({ _id: id }).exec();
}

async function getByEmail(email) {
  return UserSchema.findOne({ email: email }).exec();
}

async function createUser(userData) {
  userData.role = [roles.User];
  userData.joined = Date.now();
  const userToCreate = new UserSchema(userData);

  return (
    userToCreate
      .save()
      .then((user) => {
        console.log("New user created!");

        return _.omit(user.toObject(), "password", "_id", "__v");
      })
      // .then((user) => (({ password, ...other }) => other)(user))
      .catch((error) => {
        console.error(error);
        return undefined;
      })
  );
}

async function updateUser(userId, { firstname, lastname, password, email }) {
  const validUserData = _.omit(
    { firstname, lastname, password, email },
    (value) => _.isUndefined(value)
  );

  return UserSchema.updateOne({ _id: userId }, { $set: validUserData })
    .then((res) => ({ success: res.modifiedCount === 1 }))
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

async function addRole(userId, newRoles) {
  if (typeof newRoles === "string") {
    newRoles = [newRoles];
  }

  if (newRoles.any((role) => !roles.includes(role))) {
    return Promise.reject(new Error("Incorrect roles"));
  }

  return UserSchema.updateOne(
    { _id: userId },
    { $addToSet: { role: newRoles } }
  ).catch((err) => {
    console.error(err);
    throw err;
  });
}

module.exports = {
  authenticate,
  getAll,
  getById,
  getByEmail,
  createUser,
  updateUser,
  addRole,
};
