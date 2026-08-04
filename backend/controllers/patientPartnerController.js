import DiagnosticCenter from "../models/DiagnosticCenter.js";
import DiagnosticTestBooking from "../models/DiagnosticTestBooking.js";
import Pharmacy from "../models/Pharmacy.js";
import PharmacyOrder from "../models/PharmacyOrder.js";

// --- Diagnostics Client Services ---

export async function getDiagnosticsAndServices(req, res) {
  try {
    const diagnostics = await DiagnosticCenter.find(
      { verificationStatus: "Verified" },
      "name email contactPhone testsCatalog"
    );
    return res.status(200).json({ success: true, diagnostics });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function bookDiagnosticTest(req, res) {
  try {
    const { diagnosticCenterId, tests, bookingDate, timeSlot, paymentMethod, patientName, patientMobile } = req.body;
    const patientId = req.auth?.userId || "guest_patient";

    if (!diagnosticCenterId || !tests || !tests.length || !bookingDate || !timeSlot || !patientName || !patientMobile) {
      return res.status(400).json({ success: false, message: "Missing required booking details" });
    }

    const center = await DiagnosticCenter.findById(diagnosticCenterId);
    if (!center) {
      return res.status(404).json({ success: false, message: "Diagnostic center not found" });
    }

    const booking = await DiagnosticTestBooking.create({
      patientId,
      patientName,
      patientMobile,
      diagnosticCenterId,
      tests,
      bookingDate,
      timeSlot,
      paymentStatus: paymentMethod === "Online" ? "Paid" : "Unpaid"
    });

    return res.status(201).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPatientDiagnosticBookings(req, res) {
  try {
    const patientId = req.auth?.userId;
    if (!patientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Retrieve bookings and populate diagnostic center info
    const bookings = await DiagnosticTestBooking.find({ patientId })
      .populate("diagnosticCenterId", "name contactPhone")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// --- Pharmacy Client Services ---

export async function getPharmaciesAndInventory(req, res) {
  try {
    const pharmacies = await Pharmacy.find(
      { verificationStatus: "Verified" },
      "name email phone inventory"
    );
    return res.status(200).json({ success: true, pharmacies });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function placePharmacyOrder(req, res) {
  try {
    const { pharmacyId, items, totalAmount, deliveryAddress } = req.body;
    const patientId = req.auth?.userId || "guest_patient";

    if (!pharmacyId || !items || !items.length || !totalAmount || !deliveryAddress) {
      return res.status(400).json({ success: false, message: "Missing required order details" });
    }

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: "Pharmacy not found" });
    }

    // Deduct stock if possible
    for (const item of items) {
      const dbItem = pharmacy.inventory.find(i => i.medicineName === item.medicineName);
      if (dbItem) {
        dbItem.stock = Math.max(0, dbItem.stock - item.quantity);
      }
    }
    await pharmacy.save();

    const order = await PharmacyOrder.create({
      patientId,
      pharmacyId,
      items,
      totalAmount,
      deliveryAddress,
      paymentStatus: req.body.paymentStatus || "Unpaid"
    });

    return res.status(201).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPatientPharmacyOrders(req, res) {
  try {
    const patientId = req.auth?.userId;
    if (!patientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await PharmacyOrder.find({ patientId })
      .populate("pharmacyId", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
