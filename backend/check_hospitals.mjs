import mongoose from "mongoose";
import Hospital from "./models/Hospital.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const list = await Hospital.find({});
  console.log("Hospitals in DB count:", list.length);
  list.forEach(h => {
    console.log(`- Name: ${h.name}, Email: ${h.email}, Status: ${h.verificationStatus}, ServicesCount: ${h.servicesCatalog?.length || 0}`);
  });
  await mongoose.disconnect();
}
run();
