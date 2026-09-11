import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from './database.js';
import dotenv from 'dotenv';
import { getCloudStatus, deleteCloudFile } from './cloudStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Thư mục lưu trữ gốc
export const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(process.cwd(), '../cloudvault-storage');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Chuyển đổi bytes thành chuỗi dung lượng đọc được (B, KB, MB, GB, TB)
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Tính mã băm SHA-256 bảo toàn tính toàn vẹn của tệp
export function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

// Lấy đường dẫn đĩa cứng tuyệt đối cho một tệp tin cục bộ
export function getFullPath(relativePath) {
  return path.join(STORAGE_DIR, relativePath);
}

// Lấy đường dẫn thư mục lưu trữ độc lập theo ID tài khoản (Private Tenant)
export function getUserStorageDir(userId, subPath = '') {
  const userDir = path.join(STORAGE_DIR, 'users', userId, subPath);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

/**
 * Lấy giới hạn dung lượng tối đa (GB thật) từ biến môi trường MAX_STORAGE_GB
 * Mặc định: 100 GB nếu không được chỉ định trong file .env
 */
export function getMaxStorageGb() {
  const envVal = process.env.MAX_STORAGE_GB;
  if (envVal && !isNaN(parseFloat(envVal)) && parseFloat(envVal) > 0) {
    return parseFloat(envVal);
  }
  return 100;
}

/**
 * Tính toán dung lượng tối đa theo đơn vị Bytes
 */
export function getStorageQuotaBytes() {
  const maxGb = getMaxStorageGb();
  return Math.round(maxGb * 1024 * 1024 * 1024);
}

/**
 * Thống kê dung lượng:
 * 1. Global Storage Pool: Tổng dung lượng thực tế đã sử dụng của TẤT CẢ người dùng cộng lại
 *    trên hạn mức thực tế MAX_STORAGE_GB đọc từ biến môi trường .env.
 * 2. User Personal Stats: Thống kê phần đóng góp và thùng rác riêng của người dùng đang đăng nhập.
 */
export function getStorageMetrics(userId) {
  const maxStorageGb = getMaxStorageGb();
  const quotaBytes = getStorageQuotaBytes();

  // Đồng bộ giá trị hạn mức vào bảng cài đặt (settings)
  try {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
      'storage_quota_bytes',
      quotaBytes.toString()
    );
  } catch (dbErr) {
    console.error('Lỗi khi lưu storage_quota_bytes vào settings:', dbErr);
  }

  // A. TỔNG DUNG LƯỢNG THỰC TẾ HỆ THỐNG CỦA TẤT CẢ NGƯỜI DÙNG (Global Storage Pool)
  // Cộng dồn dung lượng tất cả các tệp đang hoạt động (is_deleted = 0)
  const globalStats = db.prepare(`
    SELECT 
      COUNT(*) as total_count,
      COALESCE(SUM(size), 0) as total_size,
      COALESCE(SUM(CASE WHEN category = 'photo' THEN size ELSE 0 END), 0) as photo_size,
      COALESCE(SUM(CASE WHEN category = 'photo' THEN 1 ELSE 0 END), 0) as photo_count,
      COALESCE(SUM(CASE WHEN category = 'video' THEN size ELSE 0 END), 0) as video_size,
      COALESCE(SUM(CASE WHEN category = 'video' THEN 1 ELSE 0 END), 0) as video_count,
      COALESCE(SUM(CASE WHEN category = 'document' THEN size ELSE 0 END), 0) as doc_size,
      COALESCE(SUM(CASE WHEN category = 'document' THEN 1 ELSE 0 END), 0) as doc_count,
      COALESCE(SUM(CASE WHEN category NOT IN ('photo', 'video', 'document') THEN size ELSE 0 END), 0) as other_size,
      COALESCE(SUM(CASE WHEN category NOT IN ('photo', 'video', 'document') THEN 1 ELSE 0 END), 0) as other_count
    FROM media
    WHERE is_deleted = 0
  `).get();

  // B. Thống kê riêng của người dùng hiện tại (Private Tenant stats)
  const userStats = db.prepare(`
    SELECT 
      COUNT(*) as user_count,
      COALESCE(SUM(size), 0) as user_size
    FROM media
    WHERE user_id = ? AND is_deleted = 0
  `).get(userId);

  // C. Thống kê thùng rác riêng của người dùng hiện tại
  const userTrashStats = db.prepare(`
    SELECT 
      COUNT(*) as trash_count,
      COALESCE(SUM(size), 0) as trash_size
    FROM media
    WHERE user_id = ? AND is_deleted = 1
  `).get(userId);

  // D. Thống kê đĩa cứng vật lý
  let physicalFree = 0;
  let physicalTotal = 0;
  try {
    if (fs.statfsSync) {
      const stat = fs.statfsSync(STORAGE_DIR);
      physicalFree = stat.bavail * stat.bsize;
      physicalTotal = stat.blocks * stat.bsize;
    }
  } catch (e) {}

  // Tính toán dung lượng thực tế và phần trăm đã dùng
  const usedBytes = globalStats.total_size;
  const remainingBytes = Math.max(0, quotaBytes - usedBytes);
  // Tính % chính xác đến 2 chữ số thập phân
  const usedPercent = quotaBytes > 0 
    ? Number(Math.min(100, (usedBytes / quotaBytes) * 100).toFixed(2)) 
    : 0;

  // Lấy trạng thái kết nối Cloudflare R2 & Backblaze B2 thực tế từ .env
  const cloud = getCloudStatus();

  return {
    // 1. Chỉ số Global Storage Pool (Dùng chung cho toàn hệ thống)
    max_storage_gb: maxStorageGb,
    quota_bytes: quotaBytes,
    quota_formatted: formatBytes(quotaBytes),
    used_bytes: usedBytes,
    used_formatted: formatBytes(usedBytes),
    remaining_bytes: remainingBytes,
    remaining_formatted: formatBytes(remainingBytes),
    used_percent: usedPercent,
    active_count: globalStats.total_count,
    photo_count: globalStats.photo_count,
    photo_size: globalStats.photo_size,
    photo_size_formatted: formatBytes(globalStats.photo_size),
    video_count: globalStats.video_count,
    video_size: globalStats.video_size,
    video_size_formatted: formatBytes(globalStats.video_size),
    doc_count: globalStats.doc_count,
    doc_size: globalStats.doc_size,
    doc_size_formatted: formatBytes(globalStats.doc_size),
    other_count: globalStats.other_count,
    other_size: globalStats.other_size,
    other_size_formatted: formatBytes(globalStats.other_size),

    // 2. Chỉ số cá nhân của người dùng đang đăng nhập
    user_count: userStats.user_count,
    user_size: userStats.user_size,
    user_size_formatted: formatBytes(userStats.user_size),
    trash_count: userTrashStats.trash_count,
    trash_size: userTrashStats.trash_size,
    trash_size_formatted: formatBytes(userTrashStats.trash_size),

    // 3. Hệ thống đĩa cứng & Đám mây
    physical_disk_free: physicalFree,
    physical_disk_free_formatted: formatBytes(physicalFree),
    physical_disk_total: physicalTotal,
    physical_disk_total_formatted: formatBytes(physicalTotal),
    storage_path: path.join(STORAGE_DIR, 'users', userId),
    cloud
  };
}

// Xóa vĩnh viễn tệp riêng của người dùng (Bảo mật Private Tenant)
export async function deleteMediaPermanently(id, userId) {
  const item = db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(id, userId);
  if (!item) return false;

  // Xóa trên dịch vụ đám mây (R2 / B2) nếu có
  if (item.storage_backend === 'r2' || item.storage_backend === 'b2') {
    await deleteCloudFile(item.storage_backend, item.storage_path);
  }

  // Xóa trên đĩa cục bộ nếu có
  const fullPath = getFullPath(item.storage_path);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error(`Không thể xóa tệp trên đĩa: ${fullPath}`, err);
  }

  db.prepare('DELETE FROM media WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

// Dọn sạch thùng rác riêng của người dùng
export async function emptyTrash(userId) {
  const items = db.prepare('SELECT * FROM media WHERE user_id = ? AND is_deleted = 1').all(userId);
  let deletedCount = 0;
  let reclaimedBytes = 0;

  for (const item of items) {
    if (item.storage_backend === 'r2' || item.storage_backend === 'b2') {
      await deleteCloudFile(item.storage_backend, item.storage_path);
    }

    const fullPath = getFullPath(item.storage_path);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {}

    reclaimedBytes += item.size;
    deletedCount++;
  }

  db.prepare('DELETE FROM media WHERE user_id = ? AND is_deleted = 1').run(userId);
  return { deletedCount, reclaimedBytes, reclaimedFormatted: formatBytes(reclaimedBytes) };
}
