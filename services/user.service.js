require("dotenv").config();
const jwt = require("jsonwebtoken");
const UserSchema = require("../models/user");
const roles = require("../config/roles");
// users hardcoded for simplicity, store in a db for production applications

module.exports = {
  authenticate,
  getAll,
  getById,
  createUser,
};

async function authenticate({ email, password }) {
  try {
    const user = await UserSchema.findOne({ email: email })
      .select("+password")
      .exec();
    console.log(user);
    if (user) {
      console.log(arguments);
      console.log(email);
      console.log(`PAssword: ${password}, email: ${email}`);
      const compareResponse = await user.comparePassword(password);
      console.log(compareResponse);

      const token = jwt.sign(
        { sub: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET
      );
      delete user.password;
      return {
        user,
        token,
      };
    }
  } catch (err) {
    console.log(err);
  }
}

async function getAll() {
  return UserSchema.find({});
}

async function getById(id) {
  return await UserSchema.find({ id: id }).exec();
}

async function createUser(userData) {
  userData.role = [roles.User];
  userData.joined = Date.now();
  const userToCreate = new UserSchema(userData);

  return userToCreate.save();
}
