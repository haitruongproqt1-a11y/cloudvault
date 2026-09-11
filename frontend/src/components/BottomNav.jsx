import React from 'react';
import { 
  Images, 
  Image as ImageIcon, 
  Film, 
  FileText, 
  Trash2 
} from 'lucide-react';

export default function BottomNav({ currentTab, setCurrentTab, storageMetrics }) {
  // 5 Tabs chuẩn vàng cho trải nghiệm ngón tay trên di động
  const items = [
    { id: 'all', label: 'Tất cả', icon: Images },
    { id: 'photos', label: 'Ảnh', icon: ImageIcon },
    { id: 'videos', label: 'Video', icon: Film },
    { id: 'documents', label: 'Tài liệu', icon: FileText },
    { id: 'trash', label: 'Thùng rác', icon: Trash2, count: storageMetrics?.trash_count }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800/90 px-2 pt-2 pb-3 flex items-center justify-around shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative select-none ${
              isActive 
                ? 'text-emerald-400 bg-emerald-500/10 font-bold' 
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            }`}
          >
            {/* Đèn chỉ báo tab đang chọn */}
            {isActive && (
              <span className="absolute -top-1 w-6 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-md shadow-emerald-500/50" />
            )}

            <div className="relative mt-0.5">
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'} transition-transform`} />
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm ring-1 ring-slate-900">
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
