const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");

const { Schema } = mongoose;

const CommentSchema = new Schema({
  content: {
    type: String,
    required: "Post content  is required",
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: "comment user is required",
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: "Comment has to have post id",
  },
  created: {
    type: Date,
    index: true,
    required: "Date cant be empty!",
  },
});

CommentSchema.plugin(paginate);

module.exports = mongoose.model("Comment", CommentSchema);
