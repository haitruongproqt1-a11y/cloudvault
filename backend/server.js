import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nạp cấu hình biến môi trường từ cả 2 vị trí (.env trong backend/ và .env tại thư mục gốc)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import './auth.js'; // Khởi tạo cấu hình Passport Google Strategy
import apiRoutes from './routes.js';
import { STORAGE_DIR } from './storage.js';

const app = express();
const PORT = process.env.PORT || 5000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'cloudvault_super_secret_session_2026';

// Cho phép CORS (với credentials để hỗ trợ cookie phiên làm việc)
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// Xử lý dữ liệu JSON và form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình Express Session để duy trì đăng nhập
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Để false để chạy được cả trên HTTP nội bộ / localhost
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 ngày duy trì đăng nhập
    }
  })
);

// Khởi tạo Passport và phiên đăng nhập
app.use(passport.initialize());
app.use(passport.session());

// Gắn toàn bộ API endpoints
app.use('/api', apiRoutes);

// Phục vụ giao diện Frontend (bản build production)
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// Khởi động máy chủ lắng nghe kết nối
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================================`);
  console.log(`🚀 Máy chủ CloudVault 2.0 đang chạy tại địa chỉ: http://localhost:${PORT}`);
  console.log(`📁 Thư mục lưu trữ tệp vật lý: ${STORAGE_DIR}`);
  console.log(`🔑 Đăng nhập Gmail thật & Đám mây Backblaze B2 (S3 API) đã sẵn sàng`);
  console.log(`📱 Sẵn sàng kết nối Máy tính (PC) và Điện thoại di động qua cổng ${PORT}`);
  console.log(`====================================================================`);
});
