import Review from "../models/Review.js";
import PatientProfile from "../models/PatientProfile.js";
import Doctor from "../models/Doctor.js";
import Hospital from "../models/Hospital.js";
import DiagnosticCenter from "../models/DiagnosticCenter.js";
import Pharmacy from "../models/Pharmacy.js";
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import HospitalTestBooking from "../models/HospitalTestBooking.js";
import DiagnosticTestBooking from "../models/DiagnosticTestBooking.js";
import PharmacyOrder from "../models/PharmacyOrder.js";

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

const targetModelMap = {
  Doctor,
  Hospital,
  DiagnosticCenter,
  Pharmacy,
};

export async function submitReview(req, res) {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized (Clerk ID missing)" });
    }

    const { targetId, targetType, rating, comment } = req.body;

    if (!targetId || !targetType || !rating) {
      return res.status(400).json({ success: false, message: "targetId, targetType, and rating (1-5) are required." });
    }

    const ratingVal = Number(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5." });
    }

    const TargetModel = targetModelMap[targetType];
    if (!TargetModel) {
      return res.status(400).json({ success: false, message: `Invalid targetType: ${targetType}` });
    }

    // Verify the target exists
    const targetExists = await TargetModel.findById(targetId);
    if (!targetExists) {
      return res.status(404).json({ success: false, message: `${targetType} not found.` });
    }

    // Find the patient profile
    const patientProfile = await PatientProfile.findOne({ clerkUserId });
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: "Patient profile not found." });
    }

    // Verify patient has received services from this target
    let serviceCount = 0;
    if (targetType === "Doctor") {
      serviceCount = await Appointment.countDocuments({
        owner: clerkUserId,
        doctorId: targetId,
        status: "Completed"
      });
    } else if (targetType === "Hospital") {
      serviceCount = await HospitalTestBooking.countDocuments({
        patientId: clerkUserId,
        hospitalId: targetId,
        status: { $in: ["SampleCollected", "ReportUploaded"] }
      });
    } else if (targetType === "DiagnosticCenter") {
      serviceCount = await DiagnosticTestBooking.countDocuments({
        patientId: clerkUserId,
        diagnosticCenterId: targetId,
        status: { $in: ["SampleCollected", "ReportUploaded"] }
      });
    } else if (targetType === "Pharmacy") {
      serviceCount = await PharmacyOrder.countDocuments({
        patientId: clerkUserId,
        pharmacyId: targetId,
        orderStatus: "Delivered"
      });
    }

    if (serviceCount === 0) {
      return res.status(403).json({
        success: false,
        message: `You can only submit reviews for doctors or service providers whose services you have received.`
      });
    }

    const isGolden = serviceCount > 5;

    // Save or update review (upsert by patient & targetId)
    const filter = { patient: patientProfile._id, targetId: new mongoose.Types.ObjectId(targetId) };
    const update = {
      targetType,
      rating: ratingVal,
      comment: comment || "",
      isGolden,
    };

    const review = await Review.findOneAndUpdate(
      filter,
      update,
      { new: true, upsert: true }
    );

    // Compute new aggregate rating for the target
    const stats = await Review.aggregate([
      { $match: { targetId: new mongoose.Types.ObjectId(targetId) } },
      {
        $group: {
          _id: "$targetId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].averageRating * 10) / 10; // round to 1 decimal place
      const count = stats[0].totalReviews;

      await TargetModel.findByIdAndUpdate(targetId, {
        rating: avg,
        reviewsCount: count,
      });
    }

    return res.status(200).json({ success: true, message: "Review submitted successfully", review });
  } catch (err) {
    console.error("submitReview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function getReviewsForTarget(req, res) {
  try {
    const { targetId } = req.params;
    if (!targetId) {
      return res.status(400).json({ success: false, message: "targetId is required." });
    }

    const reviews = await Review.find({ targetId: new mongoose.Types.ObjectId(targetId) })
      .populate("patient", "name imageUrl")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error("getReviewsForTarget error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
