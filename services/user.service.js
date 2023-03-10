require("dotenv").config();
const jwt = require("jsonwebtoken");
const _ = require("underscore");
const UserSchema = require("../models/user");
const PostSchema = require("../models/post");
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

      if (!compareResponse) {
        return { error: "Brak autoryzacji!" };
      }
      const token = jwt.sign(
        {
          sub: user.id,
          role: user.role,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        process.env.JWT_SECRET
      );
      const userToReturn = _.pick(user, [
        "_id",
        "firstname",
        "lastname",
        "email",
        "joined",
        "role",
      ]);

      return {
        user: userToReturn,
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

async function addRole(userId, newRole) {
  if (!_.has(roles, newRole)) {
    return Promise.reject(new Error("Incorrect roles"));
  }

  return UserSchema.updateOne({ _id: userId }, { $addToSet: { role: newRole } })
    .then((result) => result.modifiedCount === 1)
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

async function getUserPosts(userId, page) {
  const options = {
    page: page,
    limit: nPerPage,
    sort: { created: -1 },
    options: { populate: ["last10comments", "postedBy"] },
  };

  return PostSchema.paginate({ postedBy: userId }, options);
}

function onlyLettersAndSpaces(str) {
  return /[a-zA-Z.@]*/.test(str);
}

function searchForUsers(fullQuery, page) {
  return new Promise((resolve, reject) => {
    if (!onlyLettersAndSpaces(fullQuery))
      reject(new Error("Niepoprawne znaki w zapytaniu!"));

    const options = {
      page: page,
      limit: nPerPage,
      sort: { created: -1 },
      select: ["-role"],
    };

    const queryForUsers = (query) => ({
      $regex: query,
      $options: "i",
    });

    const searchQuery = (value) => [
      { firstname: value },
      { lastname: value },
      { email: value },
    ];

    const queries = fullQuery
      .split(" ")
      .map((part) => queryForUsers(part))
      .map((part) => searchQuery(part));

    const joinedQueriesObj = [].concat(...queries);

    UserSchema.paginate(
      {
        $or: joinedQueriesObj,
      },
      options
    )
      .then((result) => resolve(result))
      .catch((error) => {
        console.error(error);
        return error;
      });
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
  getUserPosts,
  searchForUsers,
};
