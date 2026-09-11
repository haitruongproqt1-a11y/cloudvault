import React from 'react';
import { 
  Images, 
  Image as ImageIcon, 
  Film, 
  FileText,
  Star, 
  Trash2, 
  HardDrive, 
  Smartphone,
  ShieldCheck,
  FolderSync
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  storageMetrics, 
  onOpenMobileConnect 
}) {
  const docOtherCount = (storageMetrics?.doc_count || 0) + (storageMetrics?.other_count || 0);
  const quotaLabel = storageMetrics?.quota_formatted ? `Dung lượng (${storageMetrics.quota_formatted})` : 'Kho lưu trữ';

  const navItems = [
    { id: 'all', label: 'Tất cả tệp tin', icon: Images, count: storageMetrics?.user_count ?? storageMetrics?.active_count },
    { id: 'photos', label: 'Ảnh', icon: ImageIcon, count: storageMetrics?.photo_count },
    { id: 'videos', label: 'Video', icon: Film, count: storageMetrics?.video_count },
    { id: 'documents', label: 'Tài liệu & Tệp khác', icon: FileText, count: docOtherCount > 0 ? docOtherCount : undefined },
    { id: 'favorites', label: 'Yêu thích', icon: Star },
    { id: 'trash', label: 'Thùng rác', icon: Trash2, count: storageMetrics?.trash_count, badgeColor: 'bg-rose-500/20 text-rose-400' },
    { id: 'storage', label: quotaLabel, icon: HardDrive }
  ];

  return (
    <aside className="w-64 bg-slate-900/50 border-r border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.badgeColor || (isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400')
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dynamic Storage Widget Card */}
        {storageMetrics && (
          <div 
            onClick={() => setCurrentTab('storage')}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl cursor-pointer transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                Dung lượng {storageMetrics.quota_formatted || ''}
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {storageMetrics.used_percent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(storageMetrics.used_bytes > 0 ? 2 : 0, storageMetrics.used_percent))}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Đã dùng {storageMetrics.used_formatted}</span>
              <span>Trống {storageMetrics.remaining_formatted}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info & Mobile connect quick banner */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <button
          onClick={onOpenMobileConnect}
          className="w-full p-3 bg-gradient-to-r from-sky-950/40 to-emerald-950/40 border border-sky-500/20 hover:border-sky-500/40 rounded-2xl flex items-center gap-3 transition text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Kết nối Điện thoại</p>
            <p className="text-[10px] text-slate-400">Quét QR chuyển file nhanh</p>
          </div>
        </button>

        <div className="px-2 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Bảo mật Private Tenant</span>
        </div>
      </div>
    </aside>
  );
}
