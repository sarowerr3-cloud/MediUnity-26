import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Doctor", "Hospital", "DiagnosticCenter", "Pharmacy"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
    },
    isGolden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent a patient from submitting multiple reviews for the same doctor/partner
reviewSchema.index({ patient: 1, targetId: 1 }, { unique: true });
reviewSchema.index({ targetId: 1, createdAt: -1 });
reviewSchema.index({ doctorId: 1, createdAt: -1 });
reviewSchema.index({ patientId: 1, doctorId: 1 }, { unique: true, sparse: true });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
