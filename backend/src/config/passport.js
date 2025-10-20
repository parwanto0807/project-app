import { prisma } from '../config/db.js';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { PrismaClient } from '../../prisma/generated/prisma/index.js'; // Adjust the path as necessary
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
} from '../config/env.js';

// const prisma = new PrismaClient();

// Konfigurasi Strategi Google
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL,
  passReqToCallback: true // Untuk mendapatkan akses ke req jika diperlukan
}, 
async (req, accessToken, refreshToken, profile, done) => {
  try {
    // console.log('Google Profile:', profile);
    
    // Cari atau buat user berdasarkan email
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Email tidak tersedia dari Google'), null);
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        googleId: profile.id,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value
      },
      create: {
        email,
        googleId: profile.id,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        provider: 'google',
        role: 'user'
      }
    });

    return done(null, user);
  } catch (err) {
    console.error('Error in Google Strategy:', err);
    return done(err, null);
  }
}));

// Serialize user untuk sesi
passport.serializeUser((user, done) => {
  done(null, {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });
});

// Deserialize user dari sesi
passport.deserializeUser(async (userData, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userData.id }
    });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;