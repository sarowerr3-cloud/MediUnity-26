import mongoose from 'mongoose';
import 'dotenv/config';
import Doctor from './models/Doctor.js';

async function deleteTestDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database...");
    
    // Fetch all doctors to show what we are doing
    const doctors = await Doctor.find({});
    
    // Identify test doctors. E.g., 'dr1@gmail.com' or names containing 'test'
    // You can modify this filter to match exactly what you consider a "test doctor".
    // For now, let's delete doctors with emails like dr1@gmail.com, dr2@gmail.com, etc.
    const testDoctors = doctors.filter(d => {
      const emailLower = d.email.toLowerCase();
      const nameLower = d.name.toLowerCase();
      return (
        emailLower.startsWith('dr1@') || 
        emailLower.startsWith('dr2@') || 
        emailLower.startsWith('dr3@') || 
        emailLower.includes('test') || 
        nameLower.includes('test')
      );
    });

    if (testDoctors.length === 0) {
      console.log("No test doctors found based on the current criteria.");
      return;
    }

    console.log(`Found ${testDoctors.length} test doctors:`);
    testDoctors.forEach(d => console.log(`- ${d.name} (${d.email})`));

    const testDoctorIds = testDoctors.map(d => d._id);
    const result = await Doctor.deleteMany({ _id: { $in: testDoctorIds } });
    
    console.log(`Successfully deleted ${result.deletedCount} test doctors.`);
  } catch (error) {
    console.error("Error deleting test doctors:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

deleteTestDoctors();
