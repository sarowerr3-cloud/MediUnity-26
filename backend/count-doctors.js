import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const doctorSchema = new mongoose.Schema({
  email: String,
  name: String,
  verificationStatus: String,
  isVerified: Boolean,
  availability: String,
}, { strict: false });

const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

async function countDoctors() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");

  const total       = await Doctor.countDocuments();
  const verified    = await Doctor.countDocuments({ isVerified: true });
  const unverified  = await Doctor.countDocuments({ isVerified: false });
  const pending     = await Doctor.countDocuments({ verificationStatus: "Pending" });
  const rejected    = await Doctor.countDocuments({ verificationStatus: "Rejected" });
  const available   = await Doctor.countDocuments({ availability: "Available" });
  const unavailable = await Doctor.countDocuments({ availability: "Unavailable" });

  console.log("========================================");
  console.log("       DOCTOR ACCOUNTS SUMMARY");
  console.log("========================================");
  console.log(`  Total Doctors      : ${total}`);
  console.log(`  Verified           : ${verified}`);
  console.log(`  Unverified/Pending : ${unverified}`);
  console.log(`    ↳ Pending review : ${pending}`);
  console.log(`    ↳ Rejected       : ${rejected}`);
  console.log(`  Available          : ${available}`);
  console.log(`  Unavailable        : ${unavailable}`);
  console.log("========================================");

  await mongoose.disconnect();
}

countDoctors().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
