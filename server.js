// ============================================================
//  server.js  —  SKYLINE ARS Express Backend
//  Deploy on Railway · API consumed by React Frontend on Vercel
// ============================================================
require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");

// Route imports
const authRoutes        = require("./routes/auth");
const flightRoutes      = require("./routes/flights");
const bookingRoutes     = require("./routes/bookings");
const maintenanceRoutes = require("./routes/maintenance");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── SECURITY MIDDLEWARE ───────────────────────────────────────
app.use(helmet());

// ── RATE LIMITING ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(limiter);

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  // Add your Vercel URL here after deployment, e.g.:
  // "https://skyline-ars.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, Railway health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed.`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ── BODY PARSERS ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── LOGGING ───────────────────────────────────────────────────
app.use(morgan("dev"));

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "✈ SKYLINE ARS Backend is running.",
    version: "1.0.0",
    author: "Muhammad Shayan, Insa Azhar, Ahmed Waseem",
    university: "Dawood University of Engineering & Technology",
    endpoints: {
      auth:        "/api/auth",
      flights:     "/api/flights",
      bookings:    "/api/bookings",
      maintenance: "/api/maintenance",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── API ROUTES ────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/flights",     flightRoutes);
app.use("/api/bookings",    bookingRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// ── 404 HANDLER ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error." : err.message,
  });
});

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   ✈  SKYLINE ARS Backend — Server Started        ║");
  console.log(`║   🚀 Port  : ${PORT}                                ║`);
  console.log(`║   🌍 Mode  : ${process.env.NODE_ENV || "development"}                        ║`);
  console.log("║   📘 Dawood University of Engineering & Tech      ║");
  console.log("╚══════════════════════════════════════════════════╝");
});

module.exports = app;
