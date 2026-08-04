import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ---------------- Multer Storage ---------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

/* ---------------- File Filter ---------------- */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
    "image/gif",
    // Videos
    "video/mp4",
    "video/x-matroska", // mkv
    "video/webm",
    "video/avi",
    "video/x-msvideo", // avi alternative
    "video/quicktime", // mov
    "video/mpeg",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"), false);
  }
};

/* ---------------- Multer Config ---------------- */
const postMediaMulter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB limit for video files
  },
});

export default postMediaMulter;
