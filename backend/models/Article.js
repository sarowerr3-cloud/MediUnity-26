import mongoose from "mongoose";

const articleCommentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    authorId: { type: String, required: true }, // Clerk userId or Doctor ObjectId
    authorName: { type: String, required: true },
    authorRole: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },
  },
  { timestamps: true }
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, trim: true }, // Cardiology, Pediatrics, Gynecology, etc.
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    doctorName: { type: String, required: true },
    doctorImageUrl: { type: String, default: null },
    likes: [{ type: String, default: [] }], // array of userIds (patients or doctors)
    comments: [articleCommentSchema],
  },
  { timestamps: true }
);

const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);

export default Article;
