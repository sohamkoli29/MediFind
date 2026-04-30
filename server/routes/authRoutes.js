import express from 'express';
import passport from '../config/passport.js';
import { register, login, getMe } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

// Existing routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// ── Google OAuth ──────────────────────────────────────────────────────────────

// Step 1: Redirect to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Step 2: Google redirects back here
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
  (req, res) => {
    // Issue JWT and redirect to frontend with token in query param
    const token = generateToken(req.user._id, req.user.role);

    // Redirect to frontend — client reads token from URL and stores it
    const redirectURL = new URL(`${process.env.CLIENT_URL}/oauth/callback`);
    redirectURL.searchParams.set('token', token);
    redirectURL.searchParams.set('role', req.user.role);

    res.redirect(redirectURL.toString());
  }
);

export default router;