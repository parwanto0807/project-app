import passport from 'passport';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet'; // Tambahkan untuk security headers
import authRoutes from './routes/auth/authRoutes.js';
import './config/passport.js';
import { SESSION_SECRET, CLIENT_URL, NODE_ENV } from './config/env.js'; // Import dari env
import customerRoutes from './routes/master/customer/customerRoutes.js'; // Import customer routes
import productRoutes from './routes/master/product/productRoutes.js'; // Import product routes
import kategoryRoutes from './routes/master/product/kategoryProductRoutes.js'; // Import category routes
import salesOrderRoutes from './routes/salesOrder/salesOrderRoutes.js'; // Import sales order routes


const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: CLIENT_URL, // Gunakan variabel env untuk URL client
  credentials: true, // Penting untuk session/auth
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
  secret: SESSION_SECRET, // Jangan lupa untuk setup variabel SESSION_SECRET di environment
  resave: false,
  saveUninitialized: false, // Sesuaikan dengan GDPR compliance
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 hari
    httpOnly: true,  // Mengatur cookie agar tidak dapat diakses via JavaScript
    secure: NODE_ENV === 'production', // Hanya aktifkan secure di production
    sameSite: NODE_ENV === 'production' ? 'strict' : 'lax', // Lebih ketat di production
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master/customer', customerRoutes);
app.use('/api/master/product', productRoutes);
app.use('/api/master/product/kategory', kategoryRoutes);
app.use('/api/salesOrder', salesOrderRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export default app;
