import { Router } from 'express';
import {
  googleLogin,
  getProfile,
  adminLogin,
  registerAdmin,
  logoutUser,
  refreshToken,
  adminLoginRegister,
  registerEmail,
  refreshTokenHandler,
} from '../../controllers/auth/authController.js';
import { authenticateToken } from '../../middleware/authMiddleware.js'; // Import middleware

const router = Router();

// 🔐 Login dengan Google secara manual (tanpa Passport)
router.get('/google', (req, res) => {
  const redirectUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  redirectUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  redirectUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL);
  redirectUrl.searchParams.set('response_type', 'code');
  redirectUrl.searchParams.set('scope', 'openid email profile');
  redirectUrl.searchParams.set('prompt', 'select_account');
  res.redirect(redirectUrl.toString());
});

// 🔁 Callback Google OAuth
router.get('/google/callback', googleLogin);

// 🚫 Gagal login
router.get('/failed', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Google authentication failed',
  });
});


// 📝 Auth Register dengan email dan password
// 🔄 Refresh token
router.post('/refreshToken', refreshToken);
// 🔄 New Refresh token
router.get('/refresh-token', refreshTokenHandler);
// 👤 Ambil profil user (JWT wajib)
router.get('/user-login/profile', authenticateToken, getProfile);
// 🔑 Login admin
router.post('/admin/login', adminLogin);
// 🔑 Login adminRegister
router.post('/admin/loginAdmin', adminLoginRegister);
// 📝 Register admin
router.post('/admin/register', registerAdmin);
// 📝 Register admin
router.post('/admin/registerEmail', registerEmail);
// 🚪 Logout (hapus token)
router.post('/logout', logoutUser);


//Sales Order Routers
router.get('/sales/sales-order', authenticateToken);

export default router;
