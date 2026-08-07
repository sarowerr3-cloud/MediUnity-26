import mongoose from 'mongoose';
import 'dotenv/config';
import bcryptjs from 'bcryptjs';
import Doctor from './models/Doctor.js';
import crypto from 'crypto';
import { encryptField } from './utils/encryption.js';

async function checkOrCreateDoctor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const targetEmail = "sarowerr3@gmail.com";
    const allDocs = await Doctor.find({}).select("+password");
    let existingDoc = allDocs.find(d => d.email && d.email.toLowerCase().trim() === targetEmail);

    if (existingDoc) {
      console.log(`Doctor found: ${existingDoc.name} (${targetEmail})`);
      // Ensure password is set to 123456
      const salt = await bcryptjs.genSalt(10);
      existingDoc.password = await bcryptjs.hash("123456", salt);
      await existingDoc.save();
      console.log(`Updated password for ${targetEmail} to: 123456`);
    } else {
      console.log(`Doctor ${targetEmail} not found. Creating new doctor account...`);
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash("123456", salt);
      const emailHash = crypto.createHash("sha256").update(targetEmail).digest("hex");
      
      const newDoc = new Doctor({
        name: "Dr. Sarower Rahman",
        email: encryptField(targetEmail),
        emailHash: emailHash,
        password: hashedPassword,
        specialization: "Cardiology & Internal Medicine",
        bmdcNumber: "BMDC-A-111222033",
        isVerified: true,
        verificationStatus: "Verified",
        experience: "8 years",
        fee: 500,
        availability: "Available"
      });

      await newDoc.save();
      console.log(`Created doctor account for ${targetEmail} with password: 123456`);
    }
  } catch (error) {
    console.error("Error checking or creating doctor:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkOrCreateDoctor();
