const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const paginate = require("mongoose-paginate-v2");
const _ = require("underscore");
const roles = require("../config/roles");

const { Schema } = mongoose;
const SALT_WORK_FACTOR = 10;

const isRole = function (userRoles) {
  Array.isArray(userRoles) && userRoles.every((role) => role in roles);
};

const UserSchema = new Schema(
  {
    firstname: {
      type: String,
      trim: true,
      min: 1,
      max: 100,
    },
    lastname: {
      type: String,
      trim: true,
      min: 1,
      max: 100,
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
    joined: {
      type: Date,
    },
    role: {
      type: Array,
      validate: [isRole, "Please fill a valid role"],
    },
  },
  {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  }
);

UserSchema.virtual("last10posts", {
  ref: "Post}",
  localField: "_id",
  foreignField: "postedBy",
  options: { sort: { created: -1, limit: 10 } },
});

function hashPassword(password) {
  return bcrypt
    .genSalt(SALT_WORK_FACTOR)
    .then((salt) => bcrypt.hash(password, salt));
}

UserSchema.plugin(paginate);
UserSchema.pre("save", function (next) {
  const user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();

  return hashPassword(user.password)
    .then((hashedPassword) => {
      user.password = hashedPassword;
    })
    .then(() => next())
    .catch((error) => next(error));
});

UserSchema.pre("updateOne", function (next) {
  const user = this;
  const update = user._update.$set;

  if (update !== undefined && _.has(update, "password")) {
    hashPassword(update.password)
      .then((result) => {
        this._update.$set.password = result;
        console.log(update);
        console.log(this._update.$set);
      })
      .then(() => next());
  } else {
    next();
  }
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
