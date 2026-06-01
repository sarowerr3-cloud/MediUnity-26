import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    authorId: { type: String, required: true }, // Clerk userId or Doctor ObjectId
    authorName: { type: String, required: true },
    authorRole: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },
    upvotes: [{ type: String, default: [] }], // array of patient userIds
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, trim: true }, // e.g. Cardiology, Pediatrics, General
    authorId: { type: String, required: true, index: true }, // Clerk userId or Doctor ObjectId
    authorName: { type: String, required: true },
    authorRole: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
    },
    likes: [{ type: String, default: [] }],
    comments: [commentSchema],
    isQA: { type: Boolean, default: false },
    isAnonymous: { type: Boolean, default: false },
    circle: { type: String, default: null }, // e.g. "Mental Health Support", etc.
    isBanned: { type: Boolean, default: false },
    bannedReason: { type: String, default: "" },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;
