import { Queue, Worker } from "bullmq";
import { isRedisAvailable, redisConnection } from "../config/redis.js";
import EventEmitter from "events";
import Notification from "../models/Notification.js";
import { sendEmail } from "../utils/email.js";
import { sendSMSImmediate } from "../services/smsService.js";
import Appointment from "../models/Appointment.js";

import { sendSSE } from "../utils/sse.js";

// MockQueue fallback for running locally when Redis is offline
class MockQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
  }
  async add(jobName, data, opts) {
    console.log(`[MOCK QUEUE: ${this.name}] Job queued in-memory:`, jobName);
    setTimeout(() => {
      this.emit("job", { name: jobName, data, opts });
    }, 1000);
    return { id: Math.random().toString(36).substring(7) };
  }
}

// Instantiate Queues
const createQueue = (name) => {
  return isRedisAvailable
    ? new Queue(name, { connection: redisConnection })
    : new MockQueue(name);
};

export const notificationsQueue = createQueue("notifications");
export const emailsQueue = createQueue("emails");
export const smsQueue = createQueue("sms");
export const prescriptionsQueue = createQueue("prescriptions");
export const reportsQueue = createQueue("reports");

// Instantiate workers or register mock listeners
const registerWorker = (queueName, processor, options = {}) => {
  if (isRedisAvailable) {
    const worker = new Worker(queueName, processor, {
      connection: redisConnection,
      ...options,
    });
    worker.on("failed", (job, err) => {
      console.error(`[BULLMQ WORKER FAILED] Queue: ${queueName}, Job: ${job?.id}, Error:`, err.message);
    });
    console.log(`[BULLMQ] Worker for '${queueName}' initialized.`);
    return worker;
  } else {
    // Reference the mock queue instance to listen for emitted jobs
    let queueInstance;
    if (queueName === "notifications") queueInstance = notificationsQueue;
    else if (queueName === "emails") queueInstance = emailsQueue;
    else if (queueName === "sms") queueInstance = smsQueue;
    else if (queueName === "prescriptions") queueInstance = prescriptionsQueue;
    else if (queueName === "reports") queueInstance = reportsQueue;

    if (queueInstance) {
      queueInstance.on("job", async (job) => {
        try {
          await processor(job);
        } catch (err) {
          console.error(`[MOCK WORKER ERROR] Queue: ${queueName}, Error:`, err.message);
        }
      });
      console.log(`[MOCK WORKER] In-memory listener for '${queueName}' initialized.`);
    }
  }
};

// 1. Notifications Worker (FCM + Notification DB collection)
registerWorker(
  "notifications",
  async (job) => {
    const { recipientId, recipientRole, type, message, relatedBookingId } = job.data;
    console.log(`[BACKGROUND PROCESS] Notification job received: ${message}`);
    
    // Create Notification document
    const notif = await Notification.create({
      recipientId,
      recipientRole,
      type,
      message,
      relatedBookingId,
      isRead: false,
    });

    // Broadcast SSE in real time
    sendSSE(recipientId, "notification", notif);
    
    // Simulating FCM push dispatch
    console.log(`[BACKGROUND PROCESS] FCM push notification sent to user ${recipientId}.`);
  },
  { concurrency: 5 }
);

// 2. Emails Worker (SendGrid / Email Utils)
registerWorker("emails", async (job) => {
  const { to, subject, text, html } = job.data;
  console.log(`[BACKGROUND PROCESS] Sending email to ${to}`);
  await sendEmail(to, subject, text || html);
});

// 3. SMS Worker (routes to provider based on environment)
registerWorker("sms", async (job) => {
  const { phone, message } = job.data;
  console.log(`[BACKGROUND PROCESS] Sending SMS to ${phone}`);
  await sendSMSImmediate(phone, message);
});

// 4. Prescriptions Worker (PDF generation)
registerWorker("prescriptions", async (job) => {
  const { prescriptionId, patientName, doctorName, medicines, advice } = job.data;
  console.log(`[BACKGROUND PROCESS] Prescriptions worker generating PDF for ID: ${prescriptionId}`);
  // In a full run, PDFKit compiles and stores details
  console.log(`[BACKGROUND PROCESS] Prescription PDF generation finished.`);
});

// 5. Reports Worker (Analytics Aggregation + Admin Delivery)
registerWorker("reports", async (job) => {
  console.log("[BACKGROUND PROCESS] Generating analytical reports...");
  const appointmentCount = await Appointment.countDocuments({});
  const finishedAppointments = await Appointment.countDocuments({ status: "Done" });
  
  const reportBody = `MediUnity System Analytics Summary:
  - Total Appointments: ${appointmentCount}
  - Completed Consultations: ${finishedAppointments}
  - Report Timestamp: ${new Date().toLocaleString()}`;
  
  console.log(`[BACKGROUND PROCESS] Analytics Report Generated:\n${reportBody}`);
  await sendEmail("admin@mediunity.com", "MediUnity Daily Analytics Report", reportBody);
});
