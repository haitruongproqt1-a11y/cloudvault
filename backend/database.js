import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Đảm bảo thư mục lưu trữ cơ sở dữ liệu tồn tại
const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'vault.db');
const db = new DatabaseSync(dbPath);

// Kích hoạt chế độ WAL để tối ưu hiệu năng truy vấn đồng thời
db.exec('PRAGMA journal_mode = WAL;');

// 1. Khởi tạo các bảng dữ liệu (nếu chưa tồn tại)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    category TEXT NOT NULL,
    size INTEGER NOT NULL,
    sha256 TEXT,
    storage_path TEXT NOT NULL,
    storage_backend TEXT DEFAULT 'local',
    is_favorite INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    captured_at TEXT,
    tags TEXT DEFAULT '[]',
    album TEXT DEFAULT 'Default'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// 2. Nâng cấp cấu trúc bảng (Migration): Kiểm tra và thêm các cột trước khi tạo chỉ mục
try {
  const tableInfo = db.prepare('PRAGMA table_info(media)').all();
  const columnNames = tableInfo.map(col => col.name);

  if (!columnNames.includes('user_id')) {
    db.exec('ALTER TABLE media ADD COLUMN user_id TEXT;');
    console.log('🔄 [DB Migration] Đã thêm cột user_id vào bảng media');
  }

  if (!columnNames.includes('storage_backend')) {
    db.exec("ALTER TABLE media ADD COLUMN storage_backend TEXT DEFAULT 'local';");
    console.log('🔄 [DB Migration] Đã thêm cột storage_backend vào bảng media');
  }
} catch (migErr) {
  console.error('Lỗi khi kiểm tra migration:', migErr);
}

// 3. Tạo các chỉ mục (indexes) để tăng tốc truy vấn sau khi đảm bảo các cột đã tồn tại
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
  CREATE INDEX IF NOT EXISTS idx_media_is_deleted ON media(is_deleted);
  CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
  CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at);
  CREATE INDEX IF NOT EXISTS idx_media_sha256 ON media(sha256);
`);

// Thiết lập hạn mức dung lượng từ biến môi trường MAX_STORAGE_GB (Mặc định: 10 GB gói miễn phí B2)
const maxStorageGb = parseFloat(process.env.MAX_STORAGE_GB) || 10;
const defaultQuotaBytes = Math.round(maxStorageGb * 1024 * 1024 * 1024);

db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
  'storage_quota_bytes',
  defaultQuotaBytes.toString()
);

export default db;
