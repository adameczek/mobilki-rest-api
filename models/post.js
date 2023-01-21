const mongoose = require('mongoose');

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
  content: {
    type: String,
    required: "Post content  is required"
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: 'Post user is required'
    },
  created: Date,
});

module.exports = mongoose.model("Post", PostSchema);
