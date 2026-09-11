# 🚀 CloudVault 2.0 - Kho Lưu Trữ Đa Nền Tảng Đám Mây Kép

Phiên bản nâng cấp **CloudVault 2.0** với kho lưu trữ **1TB (1,000 GB Global Storage Pool)**, tích hợp **Đăng nhập Google qua Firebase Auth (Gmail thật)**, hỗ trợ **Mọi định dạng tệp tin (PDF, DOCX, ZIP, EXE...)** và **Gộp 2 dịch vụ lưu trữ đám mây Cloudflare R2 + Backblaze B2 qua S3 API** với cơ chế tự động chuyển đổi dự phòng (failover).

---

## ✨ 3 Tính Năng Cốt Lõi Vừa Cập Nhật

### 1. 📊 Dung Lượng Tổng (Global Storage Pool 1000GB)
- Thanh đo dung lượng 1000GB hiển thị **TỔNG dung lượng thực tế đã sử dụng của TẤT CẢ người dùng** trong hệ thống cộng lại.
- Bất kỳ ai đăng nhập vào hệ thống đều thấy chung một mức tổng dung lượng đã dùng và dung lượng còn trống này.
- Bảng điều khiển vẫn cung cấp chi tiết số lượng tệp và dung lượng cá nhân do bạn đóng góp.

### 2. 🔐 Bảo Mật Dữ Liệu Cá Nhân (Private Tenant Tuyệt Đối)
- Dù dùng chung thanh đo hạn mức tổng, danh sách file (`GET /api/media`), xem file, tải về và xóa file được **cô lập nghiêm ngặt 100% theo ID tài khoản Gmail**.
- Tuyệt đối không tài khoản nào có thể nhìn thấy, truy cập, tải về hoặc can thiệp vào tệp tin của tài khoản khác.

### 3. ⚙️ Bắt Buộc Dùng File .env (Chạy Thật 100%, Không Dùng Mock/Demo)
- Đã hủy bỏ hoàn toàn chế độ mock/demo login nội bộ.
- Hệ thống lấy trực tiếp cấu hình **Firebase Auth (Gmail thật)** và **S3 API Keys (Cloudflare R2 / Backblaze B2)** từ file `.env` để chạy thật.

---

## 🛡️ Bảo Toàn 100% Các Tính Năng Cũ
- ✅ **Hỗ trợ mọi định dạng tệp:** `PDF`, `DOCX`, `XLSX`, `ZIP`, `RAR`, `7Z`, `EXE`, `MSI`, `MP3`, `WAV`, `ISO`, `TXT`, ảnh và video...
- ✅ **Thùng rác 2 lớp:** Khôi phục tệp hoặc "Dọn sạch thùng rác" / "Xóa vĩnh viễn" để giải phóng bộ nhớ.
- ✅ **Mã QR kết nối Mobile:** Quét mã bằng camera điện thoại trên cùng mạng Wi-Fi để dùng trên iPhone/Android, hỗ trợ cài PWA ra màn hình chính.
- ✅ **Streaming video HTTP 206 Range:** Tua nhanh video mượt mà không độ trễ.
- ✅ **Tải về hàng loạt ZIP:** Nén nhiều tệp thành gói .zip chỉ với 1 click.
- ✅ **Mã băm SHA-256 Checksum:** Bảo toàn tính toàn vẹn, chống hỏng file.

---

## 🚀 Hướng Dẫn Khởi Động Bằng Tiếng Việt

### Cách 1: Khởi động 1-Click (Khuyên dùng trên Windows)
- Nhấp đúp chuột vào tệp: **`run-cloudvault.bat`**
- Trình duyệt sẽ tự động mở trang chủ tại `http://localhost:5000`.

### Cách 2: Khởi động bằng dòng lệnh PowerShell
```powershell
cd C:\Users\ADMIN\.gemini\antigravity\scratch\cloudvault\backend
node server.js
```

---

## ⚙️ Hướng Dẫn Cấu Hình File .env

Sao chép tệp `.env.example` thành `.env` trong thư mục `backend/` hoặc thư mục gốc:

```env
PORT=5000
STORAGE_DIR=../cloudvault-storage
SESSION_SECRET=cloudvault_super_secret_session_key_2026

# 1. Cấu hình Firebase Auth (Đăng nhập Gmail thật)
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here

# 2. Cấu hình Cloudflare R2 (S3 API - Ưu tiên 1)
CLOUDFLARE_R2_ACCOUNT_ID=your_cloudflare_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=your_r2_bucket_name_here

# 3. Cấu hình Backblaze B2 (S3 API - Dự phòng tự động)
BACKBLAZE_B2_ENDPOINT=s3.us-west-004.backblazeb2.com
BACKBLAZE_B2_ACCESS_KEY_ID=your_b2_key_id_here
BACKBLAZE_B2_SECRET_ACCESS_KEY=your_b2_application_key_here
BACKBLAZE_B2_BUCKET_NAME=your_b2_bucket_name_here
```
