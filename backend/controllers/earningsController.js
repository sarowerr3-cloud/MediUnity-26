import Appointment from "../models/Appointment.js";
import Payout from "../models/Payout.js";
import DoctorSubscription from "../models/DoctorSubscription.js";
import PlatformSettings from "../models/PlatformSettings.js";
import Doctor from "../models/Doctor.js";

/**
 * Calculate and apply commission split when an appointment is paid.
 * Called internally after payment confirmation.
 */
export async function applyCommissionSplit(appointmentId) {
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.payment?.status !== "Paid") return null;

    const paidAmount = appointment.payment.amount || appointment.fees || 0;
    if (paidAmount <= 0) return null;

    // Check if doctor has a subscription with a commission override
    let commissionRate = appointment.commissionRate || 0.15;
    const subscription = await DoctorSubscription.findOne({ doctorId: appointment.doctorId });
    if (subscription?.commissionOverride != null) {
      commissionRate = subscription.commissionOverride;
    } else if (subscription?.tier === "premium") {
      commissionRate = 0.10; // Premium doctors get reduced commission
    }

    const platformCommission = Math.round(paidAmount * commissionRate);
    const doctorPayout = paidAmount - platformCommission;

    appointment.commissionRate = commissionRate;
    appointment.platformCommission = platformCommission;
    appointment.doctorPayout = doctorPayout;
    appointment.payoutStatus = "Unpaid";
    await appointment.save();

    // Increment subscription usage counter
    if (subscription) {
      subscription.appointmentsThisMonth += 1;
      await subscription.save();
    }

    return { platformCommission, doctorPayout, commissionRate };
  } catch (err) {
    console.error("[COMMISSION SPLIT ERROR]", err.message);
    return null;
  }
}

/**
 * GET /api/earnings/summary
 * Doctor views their own earnings summary
 */
export async function getDoctorEarnings(req, res) {
  try {
    const doctorId = req.doctor?._id;
    if (!doctorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Aggregate earnings
    const [allTimeStats] = await Appointment.aggregate([
      { $match: { doctorId, "payment.status": "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$payment.amount" },
          totalCommission: { $sum: "$platformCommission" },
          totalPayout: { $sum: "$doctorPayout" },
          totalAppointments: { $sum: 1 },
        },
      },
    ]);

    const [monthlyStats] = await Appointment.aggregate([
      {
        $match: {
          doctorId,
          "payment.status": "Paid",
          paidAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$payment.amount" },
          commission: { $sum: "$platformCommission" },
          payout: { $sum: "$doctorPayout" },
          count: { $sum: 1 },
        },
      },
    ]);

    const [weeklyStats] = await Appointment.aggregate([
      {
        $match: {
          doctorId,
          "payment.status": "Paid",
          paidAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$payment.amount" },
          payout: { $sum: "$doctorPayout" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Unpaid balance
    const [unpaidStats] = await Appointment.aggregate([
      { $match: { doctorId, "payment.status": "Paid", payoutStatus: "Unpaid" } },
      {
        $group: {
          _id: null,
          unpaidTotal: { $sum: "$doctorPayout" },
          unpaidCount: { $sum: 1 },
        },
      },
    ]);

    // Recent paid appointments
    const recentTransactions = await Appointment.find(
      { doctorId, "payment.status": "Paid" },
      "patientName date fees platformCommission doctorPayout payoutStatus paidAt consultType"
    )
      .sort({ paidAt: -1 })
      .limit(20)
      .lean();

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Appointment.aggregate([
      {
        $match: {
          doctorId,
          "payment.status": "Paid",
          paidAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paidAt" },
            month: { $month: "$paidAt" },
          },
          revenue: { $sum: "$payment.amount" },
          payout: { $sum: "$doctorPayout" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Payout history
    const payoutHistory = await Payout.find({ doctorId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Subscription info
    const subscription = await DoctorSubscription.findOne({ doctorId }).lean();

    return res.status(200).json({
      success: true,
      earnings: {
        allTime: allTimeStats || { totalRevenue: 0, totalCommission: 0, totalPayout: 0, totalAppointments: 0 },
        thisMonth: monthlyStats || { revenue: 0, commission: 0, payout: 0, count: 0 },
        thisWeek: weeklyStats || { revenue: 0, payout: 0, count: 0 },
        unpaid: unpaidStats || { unpaidTotal: 0, unpaidCount: 0 },
      },
      recentTransactions,
      monthlyTrend,
      payoutHistory,
      subscription: subscription || { tier: "free", status: "active" },
    });
  } catch (err) {
    console.error("[GET DOCTOR EARNINGS ERROR]", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/admin/revenue
 * Admin views platform-wide revenue analytics
 */
export async function getAdminRevenue(req, res) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Total platform revenue
    const [allTimeRevenue] = await Appointment.aggregate([
      { $match: { "payment.status": "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$payment.amount" },
          totalCommission: { $sum: "$platformCommission" },
          totalDoctorPayouts: { $sum: "$doctorPayout" },
          totalAppointments: { $sum: 1 },
        },
      },
    ]);

    // This month
    const [thisMonthRevenue] = await Appointment.aggregate([
      { $match: { "payment.status": "Paid", paidAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$payment.amount" },
          commission: { $sum: "$platformCommission" },
          appointments: { $sum: 1 },
        },
      },
    ]);

    // Last month (for comparison)
    const [lastMonthRevenue] = await Appointment.aggregate([
      {
        $match: {
          "payment.status": "Paid",
          paidAt: { $gte: startOfLastMonth, $lt: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$payment.amount" },
          commission: { $sum: "$platformCommission" },
          appointments: { $sum: 1 },
        },
      },
    ]);

    // Top earning doctors
    const topDoctors = await Appointment.aggregate([
      { $match: { "payment.status": "Paid", paidAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: "$doctorId",
          doctorName: { $first: "$doctorName" },
          revenue: { $sum: "$payment.amount" },
          commission: { $sum: "$platformCommission" },
          appointments: { $sum: 1 },
        },
      },
      { $sort: { commission: -1 } },
      { $limit: 10 },
    ]);

    // Revenue by specialty
    const revenueBySpecialty = await Appointment.aggregate([
      { $match: { "payment.status": "Paid", paidAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: "$speciality",
          revenue: { $sum: "$payment.amount" },
          commission: { $sum: "$platformCommission" },
          count: { $sum: 1 },
        },
      },
      { $sort: { commission: -1 } },
    ]);

    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrend = await Appointment.aggregate([
      {
        $match: { "payment.status": "Paid", paidAt: { $gte: thirtyDaysAgo } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paidAt" },
            month: { $month: "$paidAt" },
            day: { $dayOfMonth: "$paidAt" },
          },
          revenue: { $sum: "$payment.amount" },
          commission: { $sum: "$platformCommission" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Pending payouts
    const [pendingPayouts] = await Appointment.aggregate([
      { $match: { "payment.status": "Paid", payoutStatus: "Unpaid" } },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$doctorPayout" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Subscription stats
    const subscriptionStats = await DoctorSubscription.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$tier",
          count: { $sum: 1 },
        },
      },
    ]);

    // Growth metrics
    const totalDoctors = await Doctor.countDocuments();
    const verifiedDoctors = await Doctor.countDocuments({ isVerified: true });

    return res.status(200).json({
      success: true,
      revenue: {
        allTime: allTimeRevenue || { totalRevenue: 0, totalCommission: 0, totalDoctorPayouts: 0, totalAppointments: 0 },
        thisMonth: thisMonthRevenue || { revenue: 0, commission: 0, appointments: 0 },
        lastMonth: lastMonthRevenue || { revenue: 0, commission: 0, appointments: 0 },
      },
      topDoctors,
      revenueBySpecialty,
      dailyTrend,
      pendingPayouts: pendingPayouts || { totalPending: 0, count: 0 },
      subscriptionStats,
      doctorStats: { total: totalDoctors, verified: verifiedDoctors },
    });
  } catch (err) {
    console.error("[ADMIN REVENUE ERROR]", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * POST /api/admin/payouts/generate
 * Admin triggers payout generation for a specific doctor or all unpaid
 */
export async function generatePayout(req, res) {
  try {
    const { doctorId } = req.body;
    
    const matchQuery = { "payment.status": "Paid", payoutStatus: "Unpaid" };
    if (doctorId) matchQuery.doctorId = doctorId;

    const unpaidAppointments = await Appointment.find(matchQuery).lean();
    if (!unpaidAppointments.length) {
      return res.status(200).json({ success: true, message: "No unpaid appointments found", payouts: [] });
    }

    // Group by doctor
    const doctorGroups = {};
    unpaidAppointments.forEach((apt) => {
      const dId = String(apt.doctorId);
      if (!doctorGroups[dId]) {
        doctorGroups[dId] = { appointments: [], doctorName: apt.doctorName || "Unknown" };
      }
      doctorGroups[dId].appointments.push(apt);
    });

    const payouts = [];
    const now = new Date();

    for (const [dId, group] of Object.entries(doctorGroups)) {
      const totalRevenue = group.appointments.reduce((sum, a) => sum + (a.payment?.amount || 0), 0);
      const totalCommission = group.appointments.reduce((sum, a) => sum + (a.platformCommission || 0), 0);
      const netPayout = group.appointments.reduce((sum, a) => sum + (a.doctorPayout || 0), 0);

      // Find period
      const dates = group.appointments.map((a) => new Date(a.paidAt || a.createdAt));
      const periodStart = new Date(Math.min(...dates));
      const periodEnd = now;

      const payout = await Payout.create({
        doctorId: dId,
        doctorName: group.doctorName,
        periodStart,
        periodEnd,
        totalAppointmentRevenue: totalRevenue,
        totalCommissionDeducted: totalCommission,
        netPayoutAmount: netPayout,
        appointmentCount: group.appointments.length,
        appointments: group.appointments.map((a) => a._id),
        status: "Pending",
      });

      // Mark appointments as pending payout
      await Appointment.updateMany(
        { _id: { $in: group.appointments.map((a) => a._id) } },
        { $set: { payoutStatus: "Pending" } }
      );

      payouts.push(payout);
    }

    return res.status(201).json({ success: true, payouts, count: payouts.length });
  } catch (err) {
    console.error("[GENERATE PAYOUT ERROR]", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * PUT /api/admin/payouts/:payoutId/complete
 * Admin marks a payout as completed
 */
export async function completePayout(req, res) {
  try {
    const { payoutId } = req.params;
    const { transactionId, paymentMethod, notes } = req.body;

    const payout = await Payout.findById(payoutId);
    if (!payout) return res.status(404).json({ success: false, message: "Payout not found" });

    payout.status = "Completed";
    payout.processedAt = new Date();
    payout.processedBy = req.admin?.email || "system";
    payout.paymentMethod = paymentMethod || "Manual";
    if (transactionId) payout.paymentDetails.transactionId = transactionId;
    if (notes) payout.notes = notes;
    await payout.save();

    // Mark all associated appointments as paid out
    await Appointment.updateMany(
      { _id: { $in: payout.appointments } },
      { $set: { payoutStatus: "Paid", paidOutAt: new Date() } }
    );

    return res.status(200).json({ success: true, payout });
  } catch (err) {
    console.error("[COMPLETE PAYOUT ERROR]", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/admin/payouts
 * Admin lists all payouts
 */
export async function listPayouts(req, res) {
  try {
    const { status, doctorId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;

    const payouts = await Payout.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Payout.countDocuments(query);

    return res.status(200).json({ success: true, payouts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("[LIST PAYOUTS ERROR]", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/admin/settings
 * Get platform settings
 */
export async function getPlatformSettings(req, res) {
  try {
    const settings = await PlatformSettings.getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * PUT /api/admin/settings
 * Update platform settings
 */
export async function updatePlatformSettings(req, res) {
  try {
    const settings = await PlatformSettings.getSettings();
    const allowedFields = [
      "defaultCommissionRate",
      "pharmacyCommissionRate",
      "diagnosticCommissionRate",
      "minimumPayoutAmount",
      "payoutSchedule",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
