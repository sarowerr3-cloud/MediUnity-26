/**
 * Materialized View & Pre-computed Dashboard Analytics Engine
 * Avoids single-collection heavy aggregations during peak traffic
 */
import Appointment from "../models/Appointment.js";
import cacheService from "./cacheService.js";

export async function getDoctorPrecomputedStats(doctorId) {
  const cacheKey = `analytics:doctor:${doctorId}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const stats = await Appointment.aggregate([
      { $match: { doctorId: doctorId } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedConsultations: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$payment.status", "Paid"] }, "$fees", 0] },
          },
          pendingConsultations: {
            $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalAppointments: 0,
      completedConsultations: 0,
      totalRevenue: 0,
      pendingConsultations: 0,
    };

    // Cache pre-computed result for 60 seconds
    cacheService.set(cacheKey, result, 60000);
    return result;
  } catch (error) {
    console.error("getDoctorPrecomputedStats error:", error);
    return { totalAppointments: 0, completedConsultations: 0, totalRevenue: 0, pendingConsultations: 0 };
  }
}
