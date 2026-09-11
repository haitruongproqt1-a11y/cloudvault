# 🚀 HƯỚNG DẪN TRIỂN KHAI CLOUDVAULT LÊN GITHUB, RENDER & ĐÓNG GÓI ANDROID

Tài liệu này hướng dẫn chi tiết từng bước để bạn đưa dự án **CloudVault** từ máy tính cá nhân lên môi trường máy chủ Internet thực tế (GitHub + Render) và đóng gói thành ứng dụng di động Android (APK).

---

## 📌 BƯỚC 1: ĐẨY TOÀN BỘ MÃ NGUỒN LÊN GITHUB

### 1.1. Chuẩn bị file `.gitignore`
Đảm bảo các thư mục nặng như `node_modules/`, `cloudvault-storage/` không bị đẩy lên GitHub:
Hệ thống đã chuẩn bị sẵn file `.gitignore` an toàn cho dự án.

### 1.2. Tạo Repository mới trên GitHub
1. Truy cập [https://github.com/new](https://github.com/new).
2. Đặt tên Repository: `cloudvault` (hoặc tên tùy thích).
3. Chọn chế độ **Private** (khuyên dùng để bảo mật các file cá nhân).
4. Bấm **Create repository**.

### 1.3. Chạy lệnh đẩy mã nguồn bằng Terminal / PowerShell
Mở PowerShell tại thư mục dự án `C:\Users\ADMIN\.gemini\antigravity\scratch\cloudvault` và chạy lần lượt:

```bash
# 1. Khởi tạo kho lưu trữ Git
git init

# 2. Thêm tất cả các file vào Git
git add .

# 3. Tạo bản commit đầu tiên
git commit -m "Khoi tao du an CloudVault 2.0 - Firebase Auth & Backblaze B2 S3"

# 4. Đổi tên nhánh chính thành main
git branch -M main

# 5. Gắn liên kết tới kho GitHub của bạn (thay bằng link GitHub của bạn)
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/cloudvault.git

# 6. Đẩy toàn bộ mã lên GitHub
git push -u origin main
```

---

## 🌐 BƯỚC 2: TRIỂN KHAI BACKEND LÊN RENDER (MIỄN PHÍ)

Render là nền tảng đám mây tốt nhất để chạy ứng dụng Node.js Express full-stack hoàn toàn miễn phí.

### 2.1. Tạo Web Service mới trên Render
1. Truy cập [https://dashboard.render.com/](https://dashboard.render.com/) và đăng nhập bằng tài khoản **GitHub**.
2. Nhấp nút **New +** ở góc trên cùng bên phải ➔ Chọn **Web Service**.
3. Tìm và chọn repository `cloudvault` bạn vừa đẩy lên ở Bước 1.

### 2.2. Cấu hình thông số Web Service
Thiết lập các ô thông tin như sau:
- **Name**: `cloudvault-2026` (hoặc tên tùy ý, đây sẽ là đường dẫn web của bạn: `https://cloudvault-2026.onrender.com`).
- **Region**: `Singapore (Southeast Asia)` hoặc `Oregon (US West)` (để gần máy chủ Backblaze B2).
- **Branch**: `main`
- **Root Directory**: Để trống (mặc định là thư mục gốc).
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  cd frontend && npm install && npm run build && cd ../backend && npm install
  ```
- **Start Command**:
  ```bash
  cd backend && node server.js
  ```
- **Instance Type**: Chọn **Free** (Miễn phí 100%).

### 2.3. Cấu hình biến môi trường (Environment Variables) trên Render
Kéo xuống mục **Environment Variables** (Biến môi trường) và thêm các biến sau:

| Tên biến | Giá trị |
|---|---|
| `PORT` | `5000` |
| `MAX_STORAGE_GB` | `100` |
| `SESSION_SECRET` | `cloudvault_super_secret_session_key_2026` |
| `FIREBASE_API_KEY` | `AIzaSyAJOPRO9w-d_OxfTjyYONXp9XP1xzGn7sI` |
| `FIREBASE_AUTH_DOMAIN` | `luutru-20824.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `luutru-20824` |
| `FIREBASE_STORAGE_BUCKET` | `luutru-20824.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `471800308416` |
| `FIREBASE_APP_ID` | `1:471800308416:web:aa44f9682c396b05480325` |
| `FIREBASE_MEASUREMENT_ID` | `G-CYNQGPCRMQ` |
| `BACKBLAZE_B2_ENDPOINT` | `s3.us-west-004.backblazeb2.com` |
| `BACKBLAZE_B2_ACCESS_KEY_ID` | `f141fe8994e9` |
| `BACKBLAZE_B2_SECRET_ACCESS_KEY` | `004f296877e318cc1f96b58de9607acc93815a8927` |
| `BACKBLAZE_B2_BUCKET_NAME` | `luutrudammay2026` |

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ KEY BACKBLAZE B2:**
> Khi tạo **Application Key** trong mục App Keys trên Backblaze B2, bạn sẽ nhận được 2 chuỗi:
> - **keyID**: thường dài 25 ký tự (dùng làm `BACKBLAZE_B2_ACCESS_KEY_ID`).
> - **applicationKey**: chuỗi dài bí mật (dùng làm `BACKBLAZE_B2_SECRET_ACCESS_KEY`).
> Hãy đảm bảo bạn dán đúng `keyID` để tránh lỗi *Malformed Access Key Id*.

### 2.4. Thêm tên miền Render vào Firebase Authorized Domains
Sau khi Render cấp cho bạn tên miền (ví dụ: `cloudvault-2026.onrender.com`):
1. Mở [Firebase Console](https://console.firebase.google.com/project/luutru-20824/authentication/settings).
2. Chọn tab **Settings** ➔ Mục **Authorized domains**.
3. Bấm **Add domain** ➔ Nhập `cloudvault-2026.onrender.com` ➔ Bấm **Save**.
*(Bước này đảm bảo Google Sign-In hoạt động trơn tru trên tên miền web mới của bạn!)*

---

## 📱 BƯỚC 3: ĐÓNG GÓI THÀNH ỨNG DỤNG DI ĐỘNG ANDROID (CAPACITOR APK)

Hệ thống đã tích hợp sẵn khung **Capacitor** và tạo sẵn thư mục dự án Android gốc (`frontend/android`).

### 3.1. Cấu hình địa chỉ máy chủ API trên điện thoại
Mở file `frontend/.env` và điền địa chỉ máy chủ Render của bạn:
```ini
VITE_API_URL=https://cloudvault-2026.onrender.com
PRODUCTION_API_URL=https://cloudvault-2026.onrender.com
```

### 3.2. Đóng gói giao diện và đồng bộ sang Android
Chạy 2 lệnh sau trong thư mục `frontend`:
```bash
cd C:\Users\ADMIN\.gemini\antigravity\scratch\cloudvault\frontend

# 1. Build giao diện web và đồng bộ vào Android
npm run cap:build
```

### 3.3. Mở dự án bằng Android Studio để xuất file APK
Chạy lệnh:
```bash
npm run cap:open:android
```
Lệnh trên sẽ tự động mở phần mềm **Android Studio** với toàn bộ mã nguồn Android của CloudVault:
1. Chờ Android Studio đồng bộ Gradle xong (khoảng 1 - 2 phút).
2. Trên thanh menu trên cùng của Android Studio, chọn:
   **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
3. Khi quá trình build hoàn tất, ở góc dưới bên phải sẽ hiện thông báo:
   *APK(s) generated successfully for 1 module: 'app'.*
4. Bấm vào chữ **locate** màu xanh để mở thư mục chứa file `app-debug.apk`.
5. Sao chép file `app-debug.apk` này vào điện thoại Android của bạn (hoặc gửi qua Zalo/Drive) và bấm cài đặt là có ngay ứng dụng CloudVault trên màn hình chính!

---

## 📋 TÓM TẮT CÁC LỆNH HỮU ÍCH

| Thao tác | Câu lệnh thực hiện |
|---|---|
| Khởi động máy chủ cục bộ (PC) | Chạy file `run-cloudvault.bat` |
| Build lại giao diện Web | `cd frontend && npm run build` |
| Đồng bộ code sang Android | `cd frontend && npm run cap:sync` |
| Build & Sync Android trong 1 bước | `cd frontend && npm run cap:build` |
| Mở Android Studio | `cd frontend && npm run cap:open:android` |
