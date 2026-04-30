import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // e.g. http://localhost:5000/api/auth/google/callback
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find existing user by googleId OR email
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if email already registered (merge accounts)
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google to existing account
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = profile.photos[0]?.value;
            await user.save();
          } else {
            // Create new user — role defaults to 'patient'
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0]?.value,
              role: 'patient',
              // No password for OAuth users
            });
          }
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account has been suspended' });
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;