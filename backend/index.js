import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import { connectDB } from './config/db.js';
import Admin from './models/Admin.js';

import { firebaseAuth } from "./middlewares/firebaseAuth.js";
import appointmentRouter from './routes/appointmentRouter.js';
import doctorRouter from './routes/doctorRouter.js';
import serviceRouter from './routes/serviceRoutes.js';
import serviceAppointmentRouter from './routes/serviceAppointmentRouter.js';
import patientProfileRouter from './routes/patientProfileRouter.js';
import postRouter from './routes/postRouter.js';
import prescriptionRouter from './routes/prescriptionRouter.js';
import adminRouter from './routes/adminRouter.js';
import articleRouter from './routes/articleRouter.js';
import journalRouter from './routes/journalRouter.js';
import healthLogRouter from './routes/healthLogRouter.js';
import messageRouter from './routes/messageRouter.js';
import medicalFileRouter from './routes/medicalFileRouter.js';
import { cleanupAllDoctorsSchedules } from './controllers/doctorController.js';

const app = express();
const port = process.env.PORT || 4000;

/* ─────────── Seed Default Admin Accounts ─────────── */
async function seedAdmins() {
  const defaults = [
    { email: "admin@mediunity.com",     password: "admin123",     role: "super-admin" },
    { email: "moderator@mediunity.com", password: "moderator123", role: "moderator"   },
    { email: "support@mediunity.com",   password: "support123",   role: "support"     },
  ];

  for (const acc of defaults) {
    const exists = await Admin.findOne({ email: acc.email });
    if (!exists) {
      const hashed = await bcrypt.hash(acc.password, 10);
      await Admin.create({ email: acc.email, password: hashed, role: acc.role });
      console.log(`[SEED] Created admin: ${acc.email} (${acc.role})`);
    }
  }
}

// ⭐ Trust Proxy for Render/Cloud environments
app.set("trust proxy", 1);

// ⭐ IMPORTANT: ENABLE CREDENTIALS FOR CLERK COOKIE SESSION
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "https://medicare-frontend-idef.onrender.com",
  "https://medicare-admin-jhtc.onrender.com",
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server & tools like Postman (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.endsWith(".onrender.com")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // ✅ REQUIRED for cookies / Clerk
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[REQUEST] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms) - Origin: ${req.headers.origin} - Auth: ${req.headers.authorization}`);
  });
  next();
});

// ⭐ Use Firebase auth middleware globally (does NOT protect routes)
app.use(firebaseAuth);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Database Connection + Seed Admins
connectDB().then(() => {
  seedAdmins().catch((err) =>
    console.error("[SEED ERROR] Failed to seed admin accounts:", err.message)
  );
  
  // Clean doctor schedules of passed dates on startup
  cleanupAllDoctorsSchedules()
    .then(() => console.log("[STARTUP] Doctor schedules initial cleanup completed."))
    .catch((err) => console.error("[STARTUP ERROR] Initial doctor schedule cleanup failed:", err));

  // Run cleanup every hour (3600000 ms)
  setInterval(() => {
    cleanupAllDoctorsSchedules().catch((err) =>
      console.error("[CRON ERROR] Periodic doctor schedule cleanup failed:", err)
    );
  }, 60 * 60 * 1000);
});

// Static uploads folder


// Routes (unchanged)
app.use("/api/appointments", appointmentRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/services", serviceRouter);
app.use("/api/service-appointments", serviceAppointmentRouter);
app.use("/api/patients", patientProfileRouter);
app.use("/api/posts", postRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/admin", adminRouter);
app.use("/api/articles", articleRouter);
app.use("/api/journals", journalRouter);
app.use("/api/health-tracker", healthLogRouter);
app.use("/api/messages", messageRouter);
app.use("/api/medical-files", medicalFileRouter);

// Test route
app.get('/', (req, res) => {
    res.send('API Working ');
});

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`);
});
