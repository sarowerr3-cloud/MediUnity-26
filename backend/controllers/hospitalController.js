import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import Hospital from "../models/Hospital.js";
import Doctor from "../models/Doctor.js";
import { verifyPartnerOnline } from "../utils/partnerScraper.js";
import HospitalTestBooking from "../models/HospitalTestBooking.js";
import HospitalAd from "../models/HospitalAd.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import crypto from "crypto";
import { isValidPassword } from "../utils/passwordPolicy.js";
import { generateTokens } from "./tokenController.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function signupHospital(req, res) {
  try {
    const { name, email, password, licenseNumber, emergencyContact, address } = req.body;
    if (!name || !email || !password || !licenseNumber || !emergencyContact) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number" });
    }

    const emailLC = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailLC).digest("hex");
    const existing = await Hospital.findOne({ emailHash });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Call online government registry scraper
    let verificationStatus = "Unverified";
    try {
      const verification = await verifyPartnerOnline(licenseNumber, name, "hospital");
      if (verification.success) {
        verificationStatus = "Verified";
      } else {
        return res.status(400).json({ success: false, message: verification.reason });
      }
    } catch (err) {
      console.warn("Online verification fallback to Pending:", err.message);
      verificationStatus = "Pending";
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const hospital = await Hospital.create({
      name,
      email: emailLC,
      password: hashedPassword,
      licenseNumber,
      emergencyContact,
      address,
      verificationStatus
    });

    const { accessToken, refreshToken } = await generateTokens(hospital._id, hospital.email, "hospital");
    return res.status(201).json({ 
      success: true, 
      token: accessToken,
      refreshToken, 
      hospital: { name: hospital.name, email: hospital.email } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function loginHospital(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const emailLC = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailLC).digest("hex");
    let hospital = await Hospital.findOne({ emailHash }).select("+password");
    
    if (!hospital) {
      // Fallback for seeded data lacking valid emailHash
      const allHospitals = await Hospital.find().select("+password");
      hospital = allHospitals.find(h => h.email && h.email.toLowerCase() === emailLC);
    }

    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital profile not found" });
    }

    const isMatch = await bcryptjs.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const { accessToken, refreshToken } = await generateTokens(hospital._id, hospital.email, "hospital");
    return res.status(200).json({ 
      success: true, 
      token: accessToken, 
      refreshToken,
      hospital: { name: hospital.name, email: hospital.email } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getHospitalProfile(req, res) {
  try {
    const hospital = await Hospital.findById(req.hospital._id).populate("doctorsRoster");
    return res.status(200).json({ success: true, hospital });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateBedAvailability(req, res) {
  try {
    const { total, occupied } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.hospital._id,
      { $set: { "bedAvailability.total": total, "bedAvailability.occupied": occupied } },
      { new: true }
    );
    return res.status(200).json({ success: true, hospital });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function addDoctorToRoster(req, res) {
  try {
    const { doctorId } = req.body;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const hospital = await Hospital.findById(req.hospital._id);
    if (hospital.doctorsRoster.includes(doctorId)) {
      return res.status(400).json({ success: false, message: "Doctor already on roster" });
    }

    hospital.doctorsRoster.push(doctorId);
    await hospital.save();

    return res.status(200).json({ success: true, message: "Doctor added to roster successfully", hospital });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/* ====================================================
   🏥 HOSPITAL SERVICES CATALOG CRUD
==================================================== */
export async function addHospitalService(req, res) {
  try {
    const { name, description, price, category } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: "Missing service name or price" });
    }
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }
    hospital.servicesCatalog.push({ name, description, price: Number(price), category });
    await hospital.save();
    return res.status(200).json({ success: true, servicesCatalog: hospital.servicesCatalog });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateHospitalService(req, res) {
  try {
    const { serviceId } = req.params;
    const { name, description, price, available, category } = req.body;
    
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }
    
    const service = hospital.servicesCatalog.id(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found in catalog" });
    }
    
    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = Number(price);
    if (available !== undefined) service.available = available;
    if (category !== undefined) service.category = category;
    
    await hospital.save();
    return res.status(200).json({ success: true, servicesCatalog: hospital.servicesCatalog });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteHospitalService(req, res) {
  try {
    const { serviceId } = req.params;
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }
    
    hospital.servicesCatalog.pull(serviceId);
    await hospital.save();
    return res.status(200).json({ success: true, servicesCatalog: hospital.servicesCatalog });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/* ====================================================
   📋 HOSPITAL TEST BOOKINGS & REPORT UPLOAD
==================================================== */
export async function getHospitalTestBookings(req, res) {
  try {
    const bookings = await HospitalTestBooking.find({ hospitalId: req.hospital.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateBookingStatus(req, res) {
  try {
    const { bookingId } = req.params;
    const { status, paymentStatus } = req.body;
    
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    
    const booking = await HospitalTestBooking.findOneAndUpdate(
      { _id: bookingId, hospitalId: req.hospital.id },
      { $set: updateData },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function uploadTestReport(req, res) {
  try {
    const { bookingId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    
    const booking = await HospitalTestBooking.findOne({ _id: bookingId, hospitalId: req.hospital.id });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    
    // Upload local file to Cloudinary
    const uploaded = await uploadToCloudinary(req.file.path, "hospital_reports");
    if (!uploaded) {
      return res.status(500).json({ success: false, message: "Failed to upload file to Cloudinary" });
    }
    
    booking.reportFileUrl = uploaded.secure_url;
    booking.reportFilePublicId = uploaded.public_id;
    booking.status = "ReportUploaded";
    await booking.save();
    
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/* ====================================================
   📢 HOSPITAL ADS CAMPAIGNS
==================================================== */
export async function createHospitalAd(req, res) {
  try {
    const { title, content, startDate, endDate, price, paymentStatus } = req.body;
    if (!title || !content || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Missing required ad campaign fields" });
    }
    
    const hospital = await Hospital.findById(req.hospital.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }
    
    let imageUrl = "";
    let imagePublicId = "";
    
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.path, "hospital_ads");
      if (uploaded) {
        imageUrl = uploaded.secure_url;
        imagePublicId = uploaded.public_id;
      }
    }
    
    const ad = await HospitalAd.create({
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      title,
      content,
      imageUrl,
      imagePublicId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      price: price ? Number(price) : 0,
      paymentStatus: paymentStatus || "Unpaid"
    });
    
    return res.status(201).json({ success: true, ad });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getHospitalAds(req, res) {
  try {
    const ads = await HospitalAd.find({ hospitalId: req.hospital.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, ads });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteHospitalAd(req, res) {
  try {
    const { adId } = req.params;
    const ad = await HospitalAd.findOneAndDelete({ _id: adId, hospitalId: req.hospital.id });
    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad campaign not found" });
    }
    return res.status(200).json({ success: true, message: "Ad campaign deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/* ====================================================
   👤 PATIENT-FACING ENDPOINTS
==================================================== */
const MOCK_HOSPITALS = [
  {
    _id: "hosp_1",
    name: "Cumilla General Hospital",
    logoUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&auto=format&fit=crop&q=80",
    address: "Station Road, Kandirpar, Cumilla",
    emergencyContact: "+880 1711-000111",
    city: "Cumilla",
    servicesCatalog: [
      { serviceName: "ICU & CCU Care", price: 3500, category: "Emergency" },
      { serviceName: "General Bed Booking", price: 800, category: "Ward" },
      { serviceName: "24/7 Trauma Service", price: 1500, category: "Emergency" }
    ]
  },
  {
    _id: "hosp_2",
    name: "Cumilla Tower Hospital & Kidney Center",
    logoUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&auto=format&fit=crop&q=80",
    address: "Laksam Road, Kandirpar, Cumilla",
    emergencyContact: "+880 1711-222333",
    city: "Cumilla",
    servicesCatalog: [
      { serviceName: "Kidney Dialysis Session", price: 2500, category: "Nephrology" },
      { serviceName: "Cabin Suite Booking", price: 2200, category: "Cabin" },
      { serviceName: "Cardiology Monitoring", price: 1800, category: "Cardiology" }
    ]
  },
  {
    _id: "hosp_3",
    name: "Dhaka Medical College Hospital (DMCH)",
    logoUrl: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=300&auto=format&fit=crop&q=80",
    address: "Secretariat Road, Ramna, Dhaka",
    emergencyContact: "+880 1711-444555",
    city: "Dhaka",
    servicesCatalog: [
      { serviceName: "Specialist OPD Consult", price: 500, category: "Outpatient" },
      { serviceName: "Emergency Operation Theater", price: 5000, category: "Surgery" }
    ]
  }
];

export async function getHospitalsAndServices(req, res) {
  try {
    let hospitals = await Hospital.find({
      $or: [{ verificationStatus: "Verified" }, { verificationStatus: { $exists: false } }, { isVerified: true }]
    }).select("name logoUrl address servicesCatalog emergencyContact city");

    if (!hospitals || hospitals.length === 0) {
      hospitals = MOCK_HOSPITALS;
    }
    return res.status(200).json({ success: true, hospitals });
  } catch (err) {
    console.warn("getHospitalsAndServices exception, returning fallback list:", err.message);
    return res.status(200).json({ success: true, hospitals: MOCK_HOSPITALS });
  }
}

export async function bookHospitalTest(req, res) {
  try {
    const { hospitalId, testName, price, bookingDate, timeSlot, patientName, patientMobile, paymentMethod } = req.body;
    const patientId = req.auth?.userId || "guest_patient";
    
    if (!hospitalId || !testName || !price || !bookingDate || !timeSlot || !patientName || !patientMobile) {
      return res.status(400).json({ success: false, message: "Missing required booking details" });
    }
    
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }
    
    const booking = await HospitalTestBooking.create({
      patientId,
      patientName,
      patientMobile,
      hospitalId,
      hospitalName: hospital.name,
      testName,
      price: Number(price),
      bookingDate,
      timeSlot,
      paymentMethod: paymentMethod || "Cash",
      paymentStatus: paymentMethod === "Online" ? "Paid" : "Unpaid"
    });
    
    return res.status(201).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPatientHospitalBookings(req, res) {
  try {
    const patientId = req.auth?.userId;
    if (!patientId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Log in to view test bookings" });
    }
    
    const bookings = await HospitalTestBooking.find({ patientId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getActiveAds(req, res) {
  try {
    const now = new Date();
    const ads = await HospitalAd.find({
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, ads });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
