import mongoose from "mongoose";
import { generateSerialNumber } from "../utils/serialGenerator.js";

const pharmacyOrderSchema = new mongoose.Schema({
  serialNumber: { type: String, unique: true, sparse: true, index: true },
  patientId: { type: String, required: true }, // Clerk UID
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
  items: [{
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number }
  }],
  totalAmount: { type: Number, required: true },
  orderStatus: { 
    type: String, 
    enum: ["Pending", "Preparing", "ReadyForPickup", "OutForDelivery", "Delivered", "Cancelled"], 
    default: "Pending" 
  },
  paymentStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
  deliveryAddress: {
    street: String,
    city: String
  }
}, { timestamps: true });

pharmacyOrderSchema.pre("save", async function () {
  if (!this.serialNumber) {
    this.serialNumber = generateSerialNumber("ORD");
  }
});

export default mongoose.model("PharmacyOrder", pharmacyOrderSchema);
