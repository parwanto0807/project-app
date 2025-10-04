import passport from "passport";
import express from "express";
import session from "express-session";
import cors from "cors";
import helmet from "helmet"; // Tambahkan untuk security headers
import authRoutes from "./routes/auth/authRoutes.js";
import "./config/passport.js";
import { SESSION_SECRET, CLIENT_URL, NODE_ENV } from "./config/env.js"; // Import dari env
import customerRoutes from "./routes/master/customer/customerRoutes.js"; // Import customer routes
import productRoutes from "./routes/master/product/productRoutes.js"; // Import product routes
import kategoryRoutes from "./routes/master/product/kategoryProductRoutes.js"; // Import category routes
import salesOrderRoutes from "./routes/salesOrder/salesOrderRoutes.js"; // Import sales order routes
import karyawanRoutes from "./routes/master/karyawan/karyawanRoutes.js";
import bapRouter from "./routes/bap/bapRoutes.js";
import spkRouter from "./routes/spk/spkRoutes.js";
import bankRoutes from "./routes/master/bank/bankRoutes.js";
import spkReportRouter from "./routes/spk/spkReportRoutes.js";
import invoiceRoutes from "./routes/invoice/invoiceRoutes.js";
import quotationRoutes from "./routes/quotation/quotationRoutes.js";
import taxRoutes from './routes/quotation/taxRoutes.js';
import paymentTermRoutes from './routes/quotation/paymentTermRoutes.js'; 
import path from "path";

const app = express();
import cookieParser from "cookie-parser";
import { allowedOrigins } from "./config/env.js";

// Security Middleware
app.use(cookieParser());
app.use(helmet());
// Expose public folder
app.use(
  "/images",
  cors({ origin: allowedOrigins, credentials: true }), // tambahkan CORS
  express.static(path.join(process.cwd(), "public/images"))
);
// CORS Configuration

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-device-id",
      "cache-control",
    ],
  })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(
  session({
    secret: SESSION_SECRET, // Jangan lupa untuk setup variabel SESSION_SECRET di environment
    resave: false,
    saveUninitialized: false, // Sesuaikan dengan GDPR compliance
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 hari
      httpOnly: true, // Mengatur cookie agar tidak dapat diakses via JavaScript
      secure: NODE_ENV === "production", // Hanya aktifkan secure di production
      sameSite: NODE_ENV === "production" ? "strict" : "lax", // Lebih ketat di production
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  // console.log('[DEBUG COOKIES]', req.cookies);
  // console.log('[DEBUG SESSION]', req.session);
  next();
});
app.use((req, res, next) => {
  // console.log('[DEBUG] WAKTU:', new Date().toISOString(), req.method, req.url, req.cookies);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/master/customer", customerRoutes);
app.use("/api/master/product", productRoutes);
app.use("/api/master/product/kategory", kategoryRoutes);
app.use("/api/master/banks", bankRoutes);
app.use("/api/salesOrder", salesOrderRoutes);
app.use("/api/karyawan", karyawanRoutes);
app.use("/api/team", karyawanRoutes);
app.use("/api/spk", spkRouter);
app.use("/api/spk/report", spkReportRouter);
app.use("/api/bap", bapRouter);
app.use("/api/invoice", invoiceRoutes);
app.use('/api/quotations', quotationRoutes);
app.use("/api/master/tax", taxRoutes);
app.use("/api/master/payment-term", paymentTermRoutes);

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

export default app;
