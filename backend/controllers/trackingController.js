import Appointment from "../models/Appointment.js";
import HospitalTestBooking from "../models/HospitalTestBooking.js";
import DiagnosticTestBooking from "../models/DiagnosticTestBooking.js";
import ServiceAppointment from "../models/serviceAppointment.js";
import PatientProfile from "../models/PatientProfile.js";
import DiagnosticCenter from "../models/DiagnosticCenter.js";

/**
 * Public endpoint to track the status of a booking by its unique serial number.
 * Patient names are masked to maintain privacy (e.g. John Doe -> J**n D*e).
 */
export async function trackBySerialNumber(req, res) {
  try {
    const { serialNumber } = req.params;
    if (!serialNumber) {
      return res.status(400).json({ success: false, message: "Serial number is required" });
    }

    const trimmedSerial = serialNumber.trim().toUpperCase();

    // 1. Search in Doctor Appointments (APT)
    if (trimmedSerial.startsWith("APT-")) {
      const docApp = await Appointment.findOne({ serialNumber: trimmedSerial });
      if (docApp) {
        return res.status(200).json({
          success: true,
          type: "Doctor Appointment",
          data: {
            serialNumber: docApp.serialNumber,
            patientName: maskName(docApp.patientName),
            date: docApp.date,
            time: docApp.time,
            status: docApp.status,
            paymentStatus: docApp.payment.status,
            paymentMethod: docApp.payment.method,
            targetName: `Dr. ${docApp.doctorName}`,
            targetSub: docApp.speciality,
            location: docApp.hospitalName || "Online Consultation"
          }
        });
      }
    }

    // 2. Search in Hospital Test Bookings (HTB)
    if (trimmedSerial.startsWith("HTB-")) {
      const hospApp = await HospitalTestBooking.findOne({ serialNumber: trimmedSerial });
      if (hospApp) {
        return res.status(200).json({
          success: true,
          type: "Hospital Test Booking",
          data: {
            serialNumber: hospApp.serialNumber,
            patientName: maskName(hospApp.patientName),
            date: hospApp.bookingDate,
            time: hospApp.timeSlot,
            status: hospApp.status,
            paymentStatus: hospApp.paymentStatus,
            paymentMethod: hospApp.paymentMethod,
            targetName: hospApp.testName,
            targetSub: "Diagnostic Lab Test",
            location: hospApp.hospitalName
          }
        });
      }
    }

    // 3. Search in Diagnostic Center Test Bookings (DTB)
    if (trimmedSerial.startsWith("DTB-")) {
      const diagApp = await DiagnosticTestBooking.findOne({ serialNumber: trimmedSerial });
      if (diagApp) {
        // Fetch patient profile to get the patient name
        let patientName = "Valued Patient";
        const patient = await PatientProfile.findOne({ clerkUserId: diagApp.patientId });
        if (patient) {
          patientName = patient.name || `${patient.email || "Patient"}`;
        }

        // Fetch diagnostic center name
        let location = "Diagnostic Center";
        const center = await DiagnosticCenter.findById(diagApp.diagnosticCenterId);
        if (center) {
          location = center.name;
        }

        // Form Date: YYYY-MM-DD
        const bookingDate = diagApp.bookingDate instanceof Date 
          ? diagApp.bookingDate.toISOString().split('T')[0] 
          : diagApp.bookingDate;

        return res.status(200).json({
          success: true,
          type: "Diagnostic Test Booking",
          data: {
            serialNumber: diagApp.serialNumber,
            patientName: maskName(patientName),
            date: bookingDate,
            time: diagApp.timeSlot,
            status: diagApp.status,
            paymentStatus: diagApp.paymentStatus,
            paymentMethod: diagApp.transactionId ? "Online" : "Cash",
            targetName: diagApp.tests.join(", "),
            targetSub: "Diagnostic Lab Tests",
            location: location
          }
        });
      }
    }

    // 4. Search in Hospital Service Appointments (SVC)
    if (trimmedSerial.startsWith("SVC-")) {
      const svcApp = await ServiceAppointment.findOne({ serialNumber: trimmedSerial });
      if (svcApp) {
        return res.status(200).json({
          success: true,
          type: "Service Appointment",
          data: {
            serialNumber: svcApp.serialNumber,
            patientName: maskName(svcApp.patientName),
            date: svcApp.date,
            time: `${svcApp.hour}:${String(svcApp.minute).padStart(2, "0")} ${svcApp.ampm}`,
            status: svcApp.status,
            paymentStatus: svcApp.payment.status,
            paymentMethod: svcApp.payment.method,
            targetName: svcApp.serviceName,
            targetSub: "Hospital Medical Service",
            location: "Hospital"
          }
        });
      }
    }

    // Fallback: If prefix didn't match or not found, do a general global search
    const [docApp, hospApp, diagApp, svcApp] = await Promise.all([
      Appointment.findOne({ serialNumber: trimmedSerial }),
      HospitalTestBooking.findOne({ serialNumber: trimmedSerial }),
      DiagnosticTestBooking.findOne({ serialNumber: trimmedSerial }),
      ServiceAppointment.findOne({ serialNumber: trimmedSerial })
    ]);

    if (docApp) {
      return res.status(200).json({
        success: true,
        type: "Doctor Appointment",
        data: {
          serialNumber: docApp.serialNumber,
          patientName: maskName(docApp.patientName),
          date: docApp.date,
          time: docApp.time,
          status: docApp.status,
          paymentStatus: docApp.payment.status,
          paymentMethod: docApp.payment.method,
          targetName: `Dr. ${docApp.doctorName}`,
          targetSub: docApp.speciality,
          location: docApp.hospitalName || "Online Consultation"
        }
      });
    }

    if (hospApp) {
      return res.status(200).json({
        success: true,
        type: "Hospital Test Booking",
        data: {
          serialNumber: hospApp.serialNumber,
          patientName: maskName(hospApp.patientName),
          date: hospApp.bookingDate,
          time: hospApp.timeSlot,
          status: hospApp.status,
          paymentStatus: hospApp.paymentStatus,
          paymentMethod: hospApp.paymentMethod,
          targetName: hospApp.testName,
          targetSub: "Diagnostic Lab Test",
          location: hospApp.hospitalName
        }
      });
    }

    if (diagApp) {
      let patientName = "Valued Patient";
      const patient = await PatientProfile.findOne({ clerkUserId: diagApp.patientId });
      if (patient) {
        patientName = patient.name || `${patient.email || "Patient"}`;
      }
      let location = "Diagnostic Center";
      const center = await DiagnosticCenter.findById(diagApp.diagnosticCenterId);
      if (center) {
        location = center.name;
      }
      const bookingDate = diagApp.bookingDate instanceof Date 
        ? diagApp.bookingDate.toISOString().split('T')[0] 
        : diagApp.bookingDate;

      return res.status(200).json({
        success: true,
        type: "Diagnostic Test Booking",
        data: {
          serialNumber: diagApp.serialNumber,
          patientName: maskName(patientName),
          date: bookingDate,
          time: diagApp.timeSlot,
          status: diagApp.status,
          paymentStatus: diagApp.paymentStatus,
          paymentMethod: diagApp.transactionId ? "Online" : "Cash",
          targetName: diagApp.tests.join(", "),
          targetSub: "Diagnostic Lab Tests",
          location: location
        }
      });
    }

    if (svcApp) {
      return res.status(200).json({
        success: true,
        type: "Service Appointment",
        data: {
          serialNumber: svcApp.serialNumber,
          patientName: maskName(svcApp.patientName),
          date: svcApp.date,
          time: `${svcApp.hour}:${String(svcApp.minute).padStart(2, "0")} ${svcApp.ampm}`,
          status: svcApp.status,
          paymentStatus: svcApp.payment.status,
          paymentMethod: svcApp.payment.method,
          targetName: svcApp.serviceName,
          targetSub: "Hospital Medical Service",
          location: "Hospital"
        }
      });
    }

    return res.status(404).json({ success: false, message: "No appointment or booking found with this serial number." });

  } catch (err) {
    console.error("[TRACKING ERROR]", err);
    return res.status(500).json({ success: false, message: "Server error occurred while tracking serial number." });
  }
}

/**
 * Masks a name for privacy.
 * E.g., "John Doe" -> "J**n D*e"
 * E.g., "Sarower Rahman" -> "S*****r R****n"
 */
function maskName(name) {
  if (!name) return "P*****t";
  return name
    .trim()
    .split(/\s+/)
    .map(word => {
      if (word.length <= 2) return word[0] + "*";
      return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
    })
    .join(" ");
}
