import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true }, // e.g. 1+0+1, 1+1+1
  frequency: { type: String, default: "" }, // e.g. Before food, After food
  duration: { type: String, default: "" }, // e.g. 7 days, 1 month
});

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    patientId: { type: String, required: true, index: true }, // Clerk userId
    patientName: { type: String, required: true },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    doctorName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    symptoms: { type: String, default: "" },
    diagnosis: { type: String, default: "" },
    medicines: [medicineSchema],
    advice: { type: String, default: "" },
    tests: { type: String, default: "" },
  },
  { timestamps: true }
);

const Prescription =
  mongoose.models.Prescription ||
  mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
