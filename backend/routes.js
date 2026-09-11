import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import QRCode from 'qrcode';
import passport from 'passport';
import db from './database.js';
import { 
  STORAGE_DIR, 
  getFullPath, 
  getUserStorageDir,
  calculateFileHash, 
  getStorageMetrics, 
  deleteMediaPermanently, 
  emptyTrash, 
  formatBytes 
} from './storage.js';
import { 
  uploadWithFailover, 
  getCloudFileStream, 
  getCloudStatus 
} from './cloudStorage.js';
import { requireAuth, isGooglePassportReady, verifyFirebaseIdToken } from './auth.js';

const router = express.Router();

// Cấu hình thư mục lưu trữ tạm thời cho Multer khi nhận luồng dữ liệu tải lên
const tempUploadDir = path.join(STORAGE_DIR, '.temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Cho phép upload BẤT KỲ ĐỊNH DẠNG TỆP NÀO, dung lượng tối đa 10GB/tệp
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10 GB
  }
});

// Phân loại toàn bộ các loại định dạng tệp tin
export function getMediaCategory(mimetype = '', filename = '') {
  const mime = mimetype.toLowerCase();
  const ext = path.extname(filename).toLowerCase();

  // 1. Ảnh (Photos)
  if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.bmp', '.svg', '.tiff', '.ico'].includes(ext)) {
    return 'photo';
  }

  // 2. Video (Videos)
  if (mime.startsWith('video/') || ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.flv', '.wmv'].includes(ext)) {
    return 'video';
  }

  // 3. Tài liệu văn phòng & Sách (Documents)
  if (
    mime.includes('pdf') || 
    mime.includes('document') || 
    mime.includes('word') || 
    mime.includes('sheet') || 
    mime.includes('excel') || 
    mime.includes('presentation') || 
    mime.includes('powerpoint') || 
    mime.includes('text') ||
    ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf', '.odt', '.ods', '.odp', '.epub', '.md'].includes(ext)
  ) {
    return 'document';
  }

  // 4. Tệp nén (Archives)
  if (
    mime.includes('zip') || 
    mime.includes('tar') || 
    mime.includes('compressed') ||
    ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso', '.tgz'].includes(ext)
  ) {
    return 'archive';
  }

  // 5. Âm thanh (Audio)
  if (mime.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'].includes(ext)) {
    return 'audio';
  }

  // 6. Mã nguồn & Lập trình (Code)
  if (['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.c', '.cpp', '.cs', '.java', '.php', '.sh', '.sql', '.xml', '.yaml', '.yml'].includes(ext)) {
    return 'code';
  }

  // 7. Ứng dụng & File thực thi (Executables)
  if (['.exe', '.msi', '.apk', '.dmg', '.pkg', '.bat', '.cmd', '.bin'].includes(ext)) {
    return 'executable';
  }

  return 'other';
}

// ====================================================================
// A. CÁC API XÁC THỰC FIREBASE AUTH (GMAIL THẬT TỪ .ENV)
// ====================================================================

// 1. GET /api/config/auth - Lấy cấu hình Firebase công khai trực tiếp từ file .env
router.get('/config/auth', (req, res) => {
  const isFirebaseReady = Boolean(
    process.env.FIREBASE_API_KEY && 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_API_KEY !== 'your_firebase_api_key_here' &&
    !process.env.FIREBASE_API_KEY.includes('Dán mã')
  );

  res.json({
    success: true,
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
      isConfigured: isFirebaseReady
    },
    googlePassport: {
      isConfigured: isGooglePassportReady
    }
  });
});

// 2. GET /api/auth/me - Kiểm tra phiên đăng nhập hiện tại
router.get('/auth/me', (req, res) => {
  const userId = req.user?.id || req.session?.userId;
  const user = userId ? db.prepare('SELECT * FROM users WHERE id = ?').get(userId) : null;
  res.json({
    success: true,
    authenticated: Boolean(user),
    user: user || null
  });
});

// 3. POST /api/auth/firebase - Xác thực và đăng nhập bằng Google idToken qua Firebase Admin SDK
router.post('/auth/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'Thiếu idToken xác thực của Google Firebase' });
    }

    // Xác thực chữ ký số và tính hợp lệ của token trực tiếp từ máy chủ Google qua Firebase Admin SDK
    const decodedToken = await verifyFirebaseIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const displayName = decodedToken.name || (email ? email.split('@')[0] : 'Người dùng Google');
    const photoURL = decodedToken.picture || null;

    if (!uid || !email) {
      return res.status(401).json({ success: false, error: 'Token Google không chứa thông tin tài khoản hợp lệ' });
    }

    let user = db.prepare('SELECT * FROM users WHERE id = ? OR email = ?').get(uid, email);
    const now = new Date().toISOString();

    if (!user) {
      db.prepare(`
        INSERT INTO users (id, google_id, email, name, avatar, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uid, uid, email, displayName, photoURL, now);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
      console.log(`👤 [FirebaseAuth] Xác thực Google thành công - Tài khoản mới: ${email} (ID: ${uid})`);
    } else {
      db.prepare(`
        UPDATE users SET name = ?, avatar = ? WHERE id = ?
      `).run(displayName, photoURL, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      console.log(`👤 [FirebaseAuth] Xác thực Google thành công - Người dùng đăng nhập: ${email} (ID: ${user.id})`);
    }

    // Thiết lập phiên làm việc bảo mật
    req.session.userId = user.id;
    req.user = user;

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ [FirebaseAuth] Lỗi xác thực token Firebase Admin:', err.message);
    res.status(401).json({ 
      success: false, 
      error: `Từ chối truy cập: Token Google không hợp lệ hoặc đã hết hạn (${err.message})` 
    });
  }
});

// 4. GET /api/auth/google & Callback (Hỗ trợ tùy chọn qua Passport)
router.get('/auth/google', (req, res, next) => {
  if (!isGooglePassportReady) {
    return res.status(400).json({
      success: false,
      error: 'Google OAuth chưa được cấu hình GOOGLE_CLIENT_ID trong file .env'
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    if (err || !user) {
      return res.redirect('/?auth=failed');
    }
    req.login(user, (loginErr) => {
      if (loginErr) return res.redirect('/?auth=failed');
      if (req.session) req.session.userId = user.id;
      return res.redirect('/');
    });
  })(req, res, next);
});

// 5. POST /api/auth/logout - Đăng xuất tài khoản
router.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (req.session) {
      req.session.destroy();
    }
    res.json({ success: true, message: 'Đã đăng xuất thành công' });
  });
});

// ====================================================================
// B. CÁC API DỮ LIỆU BẢO VỆ NGHIÊM NGẶT PRIVATE TENANT
// ====================================================================

// 6. GET /api/media - Lấy danh sách tệp CHỈ của người đang đăng nhập
router.get('/media', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { category, favorite, search, sort, is_deleted = '0' } = req.query;

    // BẢO MẬT PRIVATE TENANT: Lọc chặt chẽ theo user_id
    let query = 'SELECT * FROM media WHERE user_id = ? AND is_deleted = ?';
    const params = [userId, parseInt(is_deleted, 10)];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (favorite === '1') {
      query += ' AND is_favorite = 1';
    }

    if (search && search.trim() !== '') {
      query += ' AND (original_name LIKE ? OR album LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (sort === 'oldest') {
      query += ' ORDER BY created_at ASC';
    } else if (sort === 'size_desc') {
      query += ' ORDER BY size DESC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const items = db.prepare(query).all(...params);
    const enriched = items.map(item => ({
      ...item,
      size_formatted: formatBytes(item.size),
      url: `/api/media/${item.id}/view`,
      download_url: `/api/media/${item.id}/download`
    }));

    res.json({ success: true, items: enriched });
  } catch (err) {
    console.error('❌ [Media] Lỗi truy vấn danh sách tệp:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST /api/upload - Tải lên tệp gắn trực tiếp với userId của phiên đăng nhập
router.post('/upload', requireAuth, upload.array('files', 100), async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có tệp nào được gửi' });
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const userStorageDir = getUserStorageDir(userId, yearMonth);

    const results = [];
    const insertStmt = db.prepare(`
      INSERT INTO media (
        id, user_id, filename, original_name, mime_type, category, size, sha256, storage_path, storage_backend, created_at, captured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const file of files) {
      const id = uuidv4();
      const ext = path.extname(file.originalname).toLowerCase();
      const finalFilename = `${id}${ext}`;
      
      const relativeStoragePath = `users/${userId}/${yearMonth}/${finalFilename}`.replace(/\\/g, '/');
      const targetFilePath = path.join(userStorageDir, finalFilename);

      fs.renameSync(file.path, targetFilePath);

      const sha256 = await calculateFileHash(targetFilePath);
      const category = getMediaCategory(file.mimetype, file.originalname);
      const createdAt = now.toISOString();

      // Đọc file buffer và thực hiện tải lên Cloudflare R2 -> Failover Backblaze B2
      const fileBuffer = fs.readFileSync(targetFilePath);
      const uploadResult = await uploadWithFailover({
        key: relativeStoragePath,
        body: fileBuffer,
        mimeType: file.mimetype
      });

      insertStmt.run(
        id,
        userId,
        finalFilename,
        file.originalname,
        file.mimetype || 'application/octet-stream',
        category,
        file.size,
        sha256,
        relativeStoragePath,
        uploadResult.backend,
        createdAt,
        createdAt
      );

      results.push({
        id,
        filename: finalFilename,
        original_name: file.originalname,
        category,
        size: file.size,
        size_formatted: formatBytes(file.size),
        storage_backend: uploadResult.backend,
        url: `/api/media/${id}/view`,
        download_url: `/api/media/${id}/download`,
        created_at: createdAt
      });
    }

    res.json({ success: true, count: results.length, uploaded: results });
  } catch (err) {
    console.error('❌ [Upload] Lỗi xử lý tải lên tệp:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/media/:id/view - Xem tệp có bảo mật quyền sở hữu Private Tenant
router.get('/media/:id/view', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    // BẢO MẬT: Bắt buộc tệp phải thuộc sở hữu của userId đang đăng nhập
    const item = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!item) {
      return res.status(403).send('Bị từ chối: Bạn không có quyền truy cập tệp này (Private Tenant)');
    }

    const range = req.headers.range;

    // A. Nếu tệp lưu trên Cloudflare R2 hoặc Backblaze B2
    if (item.storage_backend === 'r2' || item.storage_backend === 'b2') {
      try {
        const cloudData = await getCloudFileStream(item.storage_backend, item.storage_path, range);
        const headers = {
          'Content-Type': item.mime_type || cloudData.contentType || 'application/octet-stream',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400'
        };

        if (range && cloudData.contentRange) {
          headers['Content-Range'] = cloudData.contentRange;
          res.writeHead(206, headers);
        } else {
          headers['Content-Length'] = cloudData.contentLength;
          res.writeHead(200, headers);
        }

        cloudData.stream.pipe(res);
        return;
      } catch (cloudErr) {
        console.warn(`Lỗi đọc cloud stream (${item.storage_backend}), đang thử đọc tệp cục bộ fallback:`, cloudErr.message);
      }
    }

    // B. Đọc tệp cục bộ
    const fullPath = getFullPath(item.storage_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('Tệp không tồn tại trên hệ thống lưu trữ');
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;

    if (range && (item.category === 'video' || item.category === 'audio')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
        return;
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(fullPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': item.mime_type || 'video/mp4'
      };

      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': item.mime_type || 'application/octet-stream',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      };
      res.writeHead(200, head);
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (err) {
    console.error('❌ [Media] Lỗi xem trực tiếp tệp:', err);
    res.status(500).send('Lỗi máy chủ khi đọc tệp');
  }
});

// 9. GET /api/media/:id/download - Tải về tệp có bảo mật Private Tenant
router.get('/media/:id/download', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const item = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!item) return res.status(403).send('Bị từ chối: Bạn không có quyền tải tệp này');

    const encodedFilename = encodeURIComponent(item.original_name);
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', item.mime_type || 'application/octet-stream');

    if (item.storage_backend === 'r2' || item.storage_backend === 'b2') {
      try {
        const cloudData = await getCloudFileStream(item.storage_backend, item.storage_path);
        cloudData.stream.pipe(res);
        return;
      } catch (cloudErr) {
        console.warn(`Lỗi tải cloud stream, thử đọc local:`, cloudErr.message);
      }
    }

    const fullPath = getFullPath(item.storage_path);
    if (fs.existsSync(fullPath)) {
      fs.createReadStream(fullPath).pipe(res);
    } else {
      res.status(404).send('Tệp không tồn tại');
    }
  } catch (err) {
    console.error('❌ [Media] Lỗi tải về tệp:', err);
    res.status(500).send(err.message);
  }
});

// 10. POST /api/media/batch-download - Tải về gói ZIP chỉ chứa tệp của người dùng hiện tại
router.post('/media/batch-download', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Không có ID nào được cung cấp' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const items = db.prepare(`SELECT * FROM media WHERE id IN (${placeholders}) AND user_id = ?`).all(...ids, userId);

    const archive = archiver('zip', { zlib: { level: 5 } });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.attachment(`cloudvault_export_${timestamp}.zip`);

    archive.pipe(res);

    const seenNames = new Map();
    for (const item of items) {
      const fullPath = getFullPath(item.storage_path);
      if (fs.existsSync(fullPath)) {
        let entryName = item.original_name;
        if (seenNames.has(entryName)) {
          const count = seenNames.get(entryName) + 1;
          seenNames.set(entryName, count);
          const ext = path.extname(entryName);
          const base = path.basename(entryName, ext);
          entryName = `${base} (${count})${ext}`;
        } else {
          seenNames.set(entryName, 0);
        }
        archive.file(fullPath, { name: entryName });
      }
    }

    archive.finalize();
  } catch (err) {
    console.error('❌ [Media] Lỗi đóng gói ZIP tải về hàng loạt:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. POST /api/media/:id/favorite - Bật/tắt yêu thích (Private Tenant)
router.post('/media/:id/favorite', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const item = db.prepare('SELECT is_favorite FROM media WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy tệp' });

    const newFav = item.is_favorite ? 0 : 1;
    db.prepare('UPDATE media SET is_favorite = ? WHERE id = ? AND user_id = ?').run(newFav, req.params.id, userId);

    res.json({ success: true, is_favorite: newFav });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. DELETE /api/media/:id - Chuyển vào thùng rác (Private Tenant)
router.delete('/media/:id', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const item = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy tệp' });

    const now = new Date().toISOString();
    db.prepare('UPDATE media SET is_deleted = 1, deleted_at = ? WHERE id = ? AND user_id = ?').run(now, req.params.id, userId);

    res.json({ success: true, message: 'Đã chuyển vào thùng rác' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. POST /api/media/:id/restore - Khôi phục từ thùng rác (Private Tenant)
router.post('/media/:id/restore', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const item = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy tệp' });

    db.prepare('UPDATE media SET is_deleted = 0, deleted_at = NULL WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Đã khôi phục tệp' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. DELETE /api/media/:id/permanent - Xóa vĩnh viễn tệp riêng (Private Tenant)
router.delete('/media/:id/permanent', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const deleted = await deleteMediaPermanently(req.params.id, userId);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy tệp để xóa' });

    res.json({ success: true, message: 'Đã xóa vĩnh viễn tệp, thu hồi dung lượng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. POST /api/trash/empty - Dọn sạch thùng rác riêng của tài khoản hiện tại
router.post('/trash/empty', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await emptyTrash(userId);
    res.json({ 
      success: true, 
      message: `Đã dọn sạch thùng rác (${result.deletedCount} tệp), giải phóng ${result.reclaimedFormatted}`,
      ...result 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16. GET /api/storage/status - Thống kê GLOBAL STORAGE POOL và thông tin riêng
router.get('/storage/status', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const metrics = getStorageMetrics(userId);
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 17. GET /api/storage/large-files - Top tệp lớn nhất của riêng người dùng
router.get('/storage/large-files', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const items = db.prepare(`
      SELECT id, original_name, category, size, mime_type, storage_backend, created_at 
      FROM media 
      WHERE user_id = ? AND is_deleted = 0 
      ORDER BY size DESC 
      LIMIT 15
    `).all(userId);

    const enriched = items.map(item => ({
      ...item,
      size_formatted: formatBytes(item.size),
      url: `/api/media/${item.id}/view`
    }));

    res.json({ success: true, items: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 18. GET /api/network/connect-info - Lấy mã QR kết nối Mobile
router.get('/network/connect-info', async (req, res) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name]) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
          addresses.push({
            name,
            ip: net.address
          });
        }
      }
    }

    const port = process.env.PORT || 5000;
    const primaryAddress = addresses.find(a => /wi-?fi/i.test(a.name)) || addresses[0] || { ip: 'localhost', name: 'local' };
    const connectUrl = `http://${primaryAddress.ip}:${port}`;

    const qrDataUrl = await QRCode.toDataURL(connectUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      port,
      primaryUrl: connectUrl,
      addresses,
      qrDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
