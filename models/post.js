const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    content: {
      type: String,
      required: "Post content  is required",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: "Post user is required",
    },
    created: {
      type: Date,
      index: true,
      required: "Date cant be empty!",
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

PostSchema.virtual("last10comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  options: { sort: { created: -1 }, limit: 10 },
});
PostSchema.plugin(paginate);

module.exports = mongoose.model("Post", PostSchema);
