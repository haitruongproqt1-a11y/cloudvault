@echo off
chcp 65001 > nul
title CloudVault 2.0 - Kho Lưu Trữ Đám Mây 1TB
color 0A

echo ====================================================================
echo             KHO LƯU TRỮ ĐA NĂNG 1TB - CLOUDVAULT 2.0
echo   Hỗ trợ Mọi Loại Tệp • Đăng Nhập Gmail Thật • Đám Mây Kép R2 & B2
echo ====================================================================
echo.

cd /d "%~dp0\backend"

echo [1/2] Đang kiểm tra thư viện hệ thống...
if not exist "node_modules" (
    echo Đang cài đặt thư viện cần thiết, vui lòng đợi trong giây lát...
    call npm install
)

echo [2/2] Khởi động máy chủ CloudVault tại cổng 5000...
echo.
echo ====================================================================
echo Máy tính (PC):  http://localhost:5000
echo Điện thoại:     Mở camera quét Mã QR trên màn hình để kết nối ngay
echo ====================================================================
echo.

start "" "http://localhost:5000"
node server.js

pause
