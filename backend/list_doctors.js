import mongoose from 'mongoose';
import 'dotenv/config';
import Doctor from './models/Doctor.js';

async function listDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const doctors = await Doctor.find({});
    console.log(`Total doctors: ${doctors.length}`);
    for (const doc of doctors) {
      console.log(`- ${doc.name} (${doc.email}) - Specialization: ${doc.specialization}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

listDoctors();
