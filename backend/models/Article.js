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
    summary: { type: String, default: "" },
    category: { type: String, required: true, trim: true }, // Cardiology, Pediatrics, etc.
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    authorId: { type: String, default: null, index: true }, // Map to doctor or author Clerk/Firebase ID
    doctorName: { type: String, required: true },
    doctorImageUrl: { type: String, default: null },
    isPublished: { type: Boolean, default: true, index: true },
    tags: [{ type: String }],
    likes: [{ type: String, default: [] }], // array of userIds
    comments: [articleCommentSchema],
  },
  { timestamps: true }
);

// Define requested indexes
articleSchema.index({ doctorId: 1, isPublished: 1, createdAt: -1 });
articleSchema.index({ authorId: 1, isPublished: 1, createdAt: -1 });
articleSchema.index({ category: 1, isPublished: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ title: "text", content: "text", summary: "text" });

const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);

export default Article;
