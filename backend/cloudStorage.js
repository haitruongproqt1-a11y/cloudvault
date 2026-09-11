import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Kiểm tra tính hợp lệ thực tế của một giá trị cấu hình S3
 * Loại bỏ chuỗi trống, undefined và các chuỗi mẫu (placeholder)
 */
export function isValidConfigValue(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed === '') return false;
  const lower = trimmed.toLowerCase();

  // Danh sách các chuỗi mẫu cần loại bỏ
  const placeholderKeywords = [
    'your_',
    'dán mã',
    'dan ma',
    'example',
    'placeholder',
    'change_me',
    'account_id_here',
    'access_key_id_here',
    'secret_access_key_here',
    'bucket_name_here',
    'key_id_here',
    'application_key_here',
    'endpoint_here',
    '_here'
  ];

  for (const keyword of placeholderKeywords) {
    if (lower.includes(keyword)) return false;
  }
  return true;
}

// ====================================================================
// CẤU HÌNH & KHỞI TẠO BACKBLAZE B2 S3 CLIENT DUY NHẤT
// ====================================================================
const b2EndpointRaw = (process.env.BACKBLAZE_B2_ENDPOINT || process.env.B2_ENDPOINT || '').trim();
const b2AccessKeyId = (
  process.env.BACKBLAZE_B2_ACCESS_KEY_ID || 
  process.env.B2_APPLICATION_KEY_ID || 
  process.env.B2_ACCESS_KEY_ID || 
  ''
).trim();
const b2SecretAccessKey = (
  process.env.BACKBLAZE_B2_SECRET_ACCESS_KEY || 
  process.env.B2_APPLICATION_KEY || 
  process.env.B2_SECRET_ACCESS_KEY || 
  ''
).trim();
const b2BucketName = (process.env.BACKBLAZE_B2_BUCKET_NAME || process.env.B2_BUCKET_NAME || '').trim();

export const isB2Configured = Boolean(
  isValidConfigValue(b2EndpointRaw) &&
  isValidConfigValue(b2AccessKeyId) &&
  isValidConfigValue(b2SecretAccessKey) &&
  isValidConfigValue(b2BucketName)
);

let b2Client = null;

if (isB2Configured) {
  try {
    let endpoint = b2EndpointRaw;
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = `https://${endpoint}`;
    }

    // Trích xuất region từ endpoint (ví dụ: s3.us-west-004.backblazeb2.com -> us-west-004)
    let region = 'us-west-004';
    const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2/i);
    if (match && match[1]) {
      region = match[1];
    }

    // Khởi tạo S3Client duy nhất cho Backblaze B2
    b2Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: b2AccessKeyId,
        secretAccessKey: b2SecretAccessKey
      }
    });
    console.log(`☁️ [Backblaze B2] Đã kết nối S3 Client thành công tới Backblaze B2:`);
    console.log(`   - Bucket: ${b2BucketName}`);
    console.log(`   - Vùng (Region): ${region}`);
    console.log(`   - Endpoint: ${endpoint}`);
  } catch (err) {
    console.error('❌ [Backblaze B2] Lỗi khởi tạo Backblaze B2 Client:', err.message);
    b2Client = null;
  }
} else {
  console.log('⚠️ [Backblaze B2] Chưa cấu hình đầy đủ khóa API trong file .env');
}

/**
 * Lấy thông tin trạng thái dịch vụ đám mây Backblaze B2 thực tế
 */
export function getCloudStatus() {
  const isB2Ready = Boolean(isB2Configured && b2Client !== null);

  return {
    b2: {
      name: 'Backblaze B2 (S3 API)',
      configured: isB2Ready,
      bucket: isB2Ready ? b2BucketName : null,
      endpoint: isB2Ready ? b2EndpointRaw : null,
      status: isB2Ready ? 'Đang hoạt động' : 'Chưa kết nối / Vui lòng cấu hình .env',
      missingOrInvalid: !isB2Ready,
      provider: 'backblaze'
    },
    hasActiveCloud: isB2Ready
  };
}

/**
 * Tải tệp trực tiếp lên Backblaze B2
 */
export async function uploadToB2({ key, body, mimeType }) {
  if (b2Client && b2BucketName) {
    try {
      console.log(`☁️ [Backblaze B2] Đang tải file lên đám mây B2: ${key}...`);
      await b2Client.send(
        new PutObjectCommand({
          Bucket: b2BucketName,
          Key: key,
          Body: body,
          ContentType: mimeType || 'application/octet-stream'
        })
      );
      console.log(`✅ [Backblaze B2] Tải lên B2 THÀNH CÔNG: ${key}`);
      return { backend: 'b2', key };
    } catch (b2Error) {
      console.error(`❌ [Backblaze B2] Lỗi tải lên B2: ${b2Error.message}`);
    }
  }

  // Fallback an toàn: Lưu cục bộ nếu B2 chưa kết nối được
  console.log(`💾 [Storage] Lưu trữ an toàn trên đĩa cứng máy chủ (Local): ${key}`);
  return { backend: 'local', key };
}

// Giữ bí danh tương thích với các module khác
export const uploadWithFailover = uploadToB2;

/**
 * Lấy Stream đọc tệp từ Backblaze B2
 */
export async function getCloudFileStream(backend, key, range = null) {
  if (!b2Client || !b2BucketName) {
    throw new Error('Dịch vụ lưu trữ đám mây Backblaze B2 chưa được kết nối trong file .env');
  }

  const params = {
    Bucket: b2BucketName,
    Key: key
  };

  if (range) {
    params.Range = range;
  }

  const command = new GetObjectCommand(params);
  const response = await b2Client.send(command);

  return {
    stream: response.Body,
    contentLength: response.ContentLength,
    contentRange: response.ContentRange,
    contentType: response.ContentType
  };
}

/**
 * Xóa vĩnh viễn tệp trên Backblaze B2
 */
export async function deleteCloudFile(backend, key) {
  try {
    if (b2Client && b2BucketName) {
      await b2Client.send(
        new DeleteObjectCommand({
          Bucket: b2BucketName,
          Key: key
        })
      );
      console.log(`🗑️ [Backblaze B2] Đã xóa tệp vĩnh viễn trên B2: ${key}`);
      return true;
    }
  } catch (err) {
    console.error('❌ [Backblaze B2] Lỗi xóa tệp trên B2:', err.message);
  }
  return false;
}
