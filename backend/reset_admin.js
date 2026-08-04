import "dotenv/config";
import connectDB from "./config/mongodb.js";
import Admin from "./models/Admin.js";
import bcrypt from "bcrypt";

async function resetAdmin() {
  try {
    await connectDB();
    const email = "admin@mediunity.com";
    const password = "admin123";
    const hashed = await bcrypt.hash(password, 10);
    
    const existing = await Admin.findOne({ email });
    if (existing) {
      existing.password = hashed;
      await existing.save();
      console.log("Admin password reset successfully.");
    } else {
      await Admin.create({ email, password: hashed, role: "super-admin" });
      console.log("Admin created successfully.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

resetAdmin();
