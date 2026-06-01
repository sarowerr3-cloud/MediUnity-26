import mongoose from "mongoose";

const medicalFileSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    filePublicId: {
      type: String,
      default: ""
    },
    fileType: {
      type: String,
      default: ""
    },
    uploadedBy: {
      type: String,
      required: true
    },
    uploaderRole: {
      type: String,
      enum: ["patient", "doctor"],
      required: true
    }
  },
  { timestamps: true }
);

const MedicalFile = mongoose.models.MedicalFile || mongoose.model("MedicalFile", medicalFileSchema);
export default MedicalFile;
