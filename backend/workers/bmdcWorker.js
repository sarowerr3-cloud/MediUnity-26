// workers/bmdcWorker.js
import { Worker } from "bullmq";
import { isRedisAvailable, redisConnection } from "../config/redis.js";
import Doctor from "../models/Doctor.js";
import { verifyDoctorBMDC } from "../utils/bmdcScraper.js";
import { bmdcQueue } from "../queues/bmdcQueue.js";

async function processBmdcVerification(data) {
  const { doctorId, bmdcNumber, doctorName } = data;
  console.log(`[BACKGROUND PROCESS] Processing BMDC verification for Doctor: ${doctorName} (ID: ${doctorId})`);

  try {
    const verification = await verifyDoctorBMDC(bmdcNumber, doctorName, 1);
    
    const updateData = {
      isVerified: verification.success,
      verificationStatus: verification.success ? "Verified" : "Rejected",
    };

    if (!verification.success) {
      console.warn(`[BACKGROUND PROCESS] BMDC verification failed for Doctor ID: ${doctorId}. Reason: ${verification.reason}`);
    } else {
      console.log(`[BACKGROUND PROCESS] BMDC verification succeeded for Doctor ID: ${doctorId}`);
    }

    await Doctor.findByIdAndUpdate(doctorId, { $set: updateData });
  } catch (err) {
    console.error(`[BACKGROUND PROCESS ERROR] BMDC verification crashed for Doctor ID: ${doctorId}:`, err.message);
    // Fallback to manual review
    await Doctor.findByIdAndUpdate(doctorId, {
      $set: {
        isVerified: false,
        verificationStatus: "Pending",
      }
    });
  }
}

if (isRedisAvailable) {
  new Worker(
    "bmdc-verification",
    async (job) => {
      await processBmdcVerification(job.data);
    },
    { connection: redisConnection }
  );
  console.log("[BULLMQ] BMDC verification background worker initialized.");
} else {
  bmdcQueue.on("job", async (job) => {
    await processBmdcVerification(job.data);
  });
  console.log("[MOCK WORKER] In-memory BMDC verification background listener initialized.");
}
