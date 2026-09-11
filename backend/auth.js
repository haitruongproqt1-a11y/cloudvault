import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Khởi tạo Firebase Admin SDK để xác thực chữ ký token Google thật
let adminAuth = null;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (projectId && projectId !== 'your_firebase_project_id_here' && !projectId.includes('Dán mã')) {
  try {
    const adminApp = getAdminApps().length === 0 ? initAdminApp({ projectId }) : getAdminApps()[0];
    adminAuth = getAdminAuth(adminApp);
    console.log(`🔒 [FirebaseAdmin] Khởi tạo Firebase Admin thành công cho dự án: ${projectId}`);
  } catch (err) {
    console.error('❌ [FirebaseAdmin] Lỗi khởi tạo Firebase Admin SDK:', err.message);
  }
}

/**
 * Xác thực Google idToken gửi từ Frontend bằng Firebase Admin SDK
 * Từ chối ngay lập tức mọi yêu cầu nếu token không hợp lệ hoặc giả mạo
 */
export async function verifyFirebaseIdToken(idToken) {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK chưa sẵn sàng hoặc chưa cấu hình FIREBASE_PROJECT_ID trong file .env');
  }
  return await adminAuth.verifyIdToken(idToken);
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

export const isGooglePassportReady = Boolean(
  GOOGLE_CLIENT_ID && 
  GOOGLE_CLIENT_SECRET && 
  GOOGLE_CLIENT_ID !== 'your_google_client_id_here'
);

// 1. Cấu hình Passport Google Strategy (nếu có Client ID từ .env)
if (isGooglePassportReady) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${googleId}@gmail.com`;
          const name = profile.displayName || email.split('@')[0];
          const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

          if (!user) {
            const id = uuidv4();
            const now = new Date().toISOString();
            db.prepare(`
              INSERT INTO users (id, google_id, email, name, avatar, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(id, googleId, email, name, avatar, now);

            user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
            console.log(`👤 [Auth] Người dùng mới đăng nhập qua Gmail: ${email} (ID: ${id})`);
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// 2. Serialize & Deserialize session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

/**
 * 3. Middleware bảo vệ API Private Tenant:
 * Bắt buộc người dùng phải có phiên đăng nhập hợp lệ.
 */
export function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }

  if (req.session && req.session.userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
    if (user) {
      req.user = user;
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Vui lòng đăng nhập bằng tài khoản Gmail thật để truy cập kho lưu trữ'
  });
}
