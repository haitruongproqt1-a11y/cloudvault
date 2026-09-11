import React, { useState } from 'react';
import { 
  Cloud, 
  Upload, 
  Smartphone, 
  Search, 
  HardDrive, 
  X,
  Menu,
  LogOut,
  User,
  Users
} from 'lucide-react';

export default function Navbar({ 
  user,
  onLogout,
  storageMetrics, 
  searchQuery, 
  setSearchQuery, 
  onOpenUpload, 
  onOpenMobileConnect, 
  onOpenStorage,
  toggleMobileMenu
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const quotaBadge = storageMetrics?.quota_formatted || 'Cloud';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cloud className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  CloudVault
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {quotaBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Kho lưu trữ đám mây đa nền tảng</p>
            </div>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm ảnh, video, tài liệu, zip, exe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-emerald-500 rounded-full pl-9 pr-8 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Storage Quota Pill: Hiển thị Global Storage Pool tổng dùng chung */}
          {storageMetrics && (
            <button
              onClick={onOpenStorage}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 rounded-full text-xs transition"
              title={`Tổng dung lượng ${storageMetrics.quota_formatted || ''} chung của hệ thống (Global Storage Pool)`}
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

          {/* Mobile QR Connect Button */}
          <button
            onClick={onOpenMobileConnect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition shadow-sm"
            title="Quét mã QR để mở trên điện thoại"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Dùng trên Mobile</span>
          </button>

          {/* Primary Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Tải lên</span>
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-800 border border-slate-700/70 transition"
                title={`Đang đăng nhập: ${user.name} (${user.email})`}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      ID: {user.id ? user.id.substring(0, 10) : 'user'}...
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất Gmail</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
