const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const roles = require("../config/roles");

const { Schema } = mongoose;
const SALT_WORK_FACTOR = 10;

const isRole = function (userRoles) {
  Array.isArray(userRoles) && userRoles.every((role) => role in roles);
};

const UserSchema = new Schema({
  firstname: {
    type: String,
    trim: true,
  },
  lastname: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    required: "Email address is required",
    validate: [validator.isEmail, "Please fill a valid email address"],
    index: {
      unique: true,
    },
  },
  password: {
    type: String,
    select: false,
  },
  joined: Date,
  role: {
    type: Array,
    validate: [isRole, "Please fill a valid role"],
  },
});

UserSchema.pre("save", function (next) {
  const user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return new Promise((resolve, reject) => {
    console.log({
      candidatePassword: candidatePassword,
      password: this.password,
    });
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) reject(err);
      resolve(isMatch);
    });
  });
};

module.exports = mongoose.model("User", UserSchema);
