import DiagnosticCenter from "../models/DiagnosticCenter.js";
import DiagnosticTestBooking from "../models/DiagnosticTestBooking.js";
import Pharmacy from "../models/Pharmacy.js";
import PharmacyOrder from "../models/PharmacyOrder.js";

// --- Diagnostics Client Services ---

const MOCK_DIAGNOSTICS = [
  {
    _id: "diag_1",
    name: "Popular Diagnostic Center Cumilla",
    email: "popular_cumilla@gmail.com",
    contactPhone: "+880 1711-888999",
    city: "Cumilla",
    testsCatalog: [
      { testName: "CBC (Complete Blood Count)", price: 400, category: "Pathology" },
      { testName: "ECG (Electrocardiogram)", price: 600, category: "Cardiology" },
      { testName: "Chest X-Ray Digital", price: 800, category: "Radiology" }
    ]
  },
  {
    _id: "diag_2",
    name: "Labaid Diagnostic Kandirpar",
    email: "labaid_cumilla@gmail.com",
    contactPhone: "+880 1711-999000",
    city: "Cumilla",
    testsCatalog: [
      { testName: "Lipid Profile Test", price: 1200, category: "Biochemistry" },
      { testName: "Whole Abdomen Ultrasonography", price: 1500, category: "Ultrasound" },
      { testName: "HbA1c Diabetes Profile", price: 700, category: "Endocrinology" }
    ]
  }
];

const MOCK_PHARMACIES = [
  {
    _id: "pharm_1",
    name: "Lazz Pharma Cumilla",
    email: "lazz_cumilla@gmail.com",
    phone: "+880 1711-555666",
    city: "Cumilla",
    inventory: [
      { medicineName: "Napa Extra 500mg", price: 2.5, stock: 500, category: "OTC" },
      { medicineName: "Seclo 20mg Capsule", price: 7, stock: 300, category: "Gastro" },
      { medicineName: "Ace 500mg Tablet", price: 2, stock: 400, category: "OTC" }
    ]
  },
  {
    _id: "pharm_2",
    name: "Tamanna Pharmacy Kandirpar",
    email: "tamanna_pharmacy@gmail.com",
    phone: "+880 1711-777888",
    city: "Cumilla",
    inventory: [
      { medicineName: "Sergel 20mg", price: 7.5, stock: 250, category: "Gastro" },
      { medicineName: "Beklo 10mg", price: 12, stock: 150, category: "Neurology" }
    ]
  }
];

export async function getDiagnosticsAndServices(req, res) {
  try {
    let diagnostics = await DiagnosticCenter.find(
      { $or: [{ verificationStatus: "Verified" }, { verificationStatus: { $exists: false } }, { isVerified: true }] },
      "name email contactPhone testsCatalog city"
    );
    if (!diagnostics || diagnostics.length === 0) {
      diagnostics = MOCK_DIAGNOSTICS;
    }
    return res.status(200).json({ success: true, diagnostics });
  } catch (err) {
    console.warn("getDiagnosticsAndServices exception, using fallback list:", err.message);
    return res.status(200).json({ success: true, diagnostics: MOCK_DIAGNOSTICS });
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
    let pharmacies = await Pharmacy.find(
      { $or: [{ verificationStatus: "Verified" }, { verificationStatus: { $exists: false } }, { isVerified: true }] },
      "name email phone inventory city"
    );
    if (!pharmacies || pharmacies.length === 0) {
      pharmacies = MOCK_PHARMACIES;
    }
    return res.status(200).json({ success: true, pharmacies });
  } catch (err) {
    console.warn("getPharmaciesAndInventory exception, using fallback list:", err.message);
    return res.status(200).json({ success: true, pharmacies: MOCK_PHARMACIES });
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
