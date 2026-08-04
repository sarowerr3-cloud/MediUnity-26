// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// 📌 Configure Cloudinary (env required)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ===========================================================
   UPLOAD FILE TO CLOUDINARY
   filePath = local path from multer (req.file.path)
   folder   = cloudinary folder e.g. "services", "doctors", "profiles"
   =========================================================== */
export async function uploadToCloudinary(filePath, folder = "Doctor") {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    // remove local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Inject Cloudinary delivery optimization parameters
    if (result.secure_url) {
      result.secure_url = result.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
    }

    return result;  // contains { secure_url, public_id, ... }
  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Cloudinary upload error:", err);
    throw err;
  }
}

export async function uploadLargeToCloudinary(filePath, folder = "Posts") {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(
        filePath,
        {
          folder,
          resource_type: "auto",
          chunk_size: 6000000, // 6MB chunk size
        },
        (error, res) => {
          if (error) return reject(error);
          resolve(res);
        }
      );
    });

    // remove local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Inject Cloudinary delivery optimization parameters
    if (result.secure_url) {
      result.secure_url = result.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
    }

    return result;  // contains { secure_url, public_id, ... }
  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Cloudinary upload_large error:", err);
    throw err;
  }
}

/* ===========================================================
   DELETE FROM CLOUDINARY (optional)
   Pass public_id from database
   =========================================================== */
export async function deleteFromCloudinary(publicId) {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    throw err;
  }
}

export default cloudinary;
