import React, { useState } from 'react';
import { 
  Cloud, 
  Upload, 
  Smartphone, 
  Search, 
  HardDrive, 
  X,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ 
  user,
  onLogout,
  storageMetrics, 
  searchQuery, 
  setSearchQuery, 
  onOpenUpload, 
  onOpenMobileConnect, 
  onOpenStorage
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const quotaBadge = storageMetrics?.quota_formatted || '10 GB';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-4 py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto">
        {/* =============================================================== */}
        {/* HÀNG 1: LOGO, BRAND, VÀ CÁC THAO TÁC PROFILE / UPLOAD CHÍNH      */}
        {/* =============================================================== */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Bên trái: Logo thương hiệu CloudVault */}
          <div 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0" 
            onClick={() => window.location.reload()}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  CloudVault
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {quotaBadge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Kho lưu trữ đám mây đa nền tảng</p>
            </div>
          </div>

          {/* Ở giữa: Thanh tìm kiếm DÀNH RIÊNG CHO MÀN HÌNH DESKTOP (Màn hình lớn) */}
          <div className="hidden md:block flex-1 max-w-md mx-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm ảnh, video, tài liệu, zip, exe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-emerald-500 rounded-full pl-9 pr-8 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Bên phải: Nút hành động và Avatar người dùng */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Storage Quota Pill (Chỉ hiện trên Desktop / Tablet lớn) */}
            {storageMetrics && (
              <button
                onClick={onOpenStorage}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 rounded-full text-xs transition shadow-sm"
                title={`Tổng dung lượng ${storageMetrics.quota_formatted || ''} chung của hệ thống`}
              >
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-300 font-medium">
                  {storageMetrics.used_formatted} / {storageMetrics.quota_formatted}
                </span>
                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(storageMetrics.used_bytes > 0 ? 3 : 0, storageMetrics.used_percent))}%` }}
                  />
                </div>
              </button>
            )}

            {/* Mobile QR Connect Button (CHỈ HIỆN TRÊN DESKTOP, KHÔNG HIỆN TRÊN MOBILE) */}
            <button
              onClick={onOpenMobileConnect}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition shadow-sm"
              title="Quét mã QR để mở trên điện thoại"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Dùng trên Mobile</span>
            </button>

            {/* Nút Tải lên (CHỈ HIỆN TRÊN DESKTOP - Trên mobile dùng nút FAB góc dưới phải) */}
            <button
              onClick={onOpenUpload}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Tải lên</span>
            </button>

            {/* User Profile Avatar & Menu (Hiển thị đẹp cả Desktop và Mobile) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-800 border border-slate-700/80 transition active:scale-95"
                  title={`Đang đăng nhập: ${user.name} (${user.email})`}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-1 ring-emerald-500/50"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

            {/* Dropdown Menu tài khoản */}
                {showUserMenu && (
                  <>
                    {/* Overlay để đóng menu khi click ngoài */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-[min(280px,calc(100vw-2rem))] bg-slate-900/98 border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-50 backdrop-blur-xl"
                      style={{ transform: 'none' }}
                    >
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800 mb-2">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-400 font-medium">
                            <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                            <span>Tài khoản riêng tư</span>
                          </div>
                        </div>
                      </div>

                      {/* Xem chi tiết dung lượng */}
                      {storageMetrics && (
                        <div className="mb-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                          <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                            <span>Dung lượng đã dùng:</span>
                            <span className="font-bold text-emerald-400">{storageMetrics.used_formatted} / {storageMetrics.quota_formatted}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(storageMetrics.used_bytes > 0 ? 3 : 0, storageMetrics.used_percent))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất Gmail</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* HÀNG 2: THANH TÌM KIẾM DÀNH RIÊNG CHO MOBILE (RỘNG RÃI & ĐẸP)     */}
        {/* =============================================================== */}
        <div className="mt-2.5 md:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm ảnh, video, tài liệu, file zip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700/80 focus:border-emerald-500 rounded-2xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
