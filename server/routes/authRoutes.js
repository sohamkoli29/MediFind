import express from 'express';
import passport from '../config/passport.js';
import { register, login, getMe, switchToPharmacyStaff } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/switch-to-pharmacy', protect, switchToPharmacyStaff);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id, req.user.role);
    const redirectURL = new URL(`${process.env.CLIENT_URL}/oauth/callback`);
    redirectURL.searchParams.set('token', token);
    redirectURL.searchParams.set('role', req.user.role);
    res.redirect(redirectURL.toString());
  }
);

export default router;