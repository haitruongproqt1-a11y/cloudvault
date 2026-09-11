import React from 'react';
import { 
  Images, 
  Image as ImageIcon, 
  Film, 
  FileText, 
  Trash2, 
  HardDrive 
} from 'lucide-react';

export default function BottomNav({ currentTab, setCurrentTab, storageMetrics }) {
  const quotaLabel = storageMetrics?.quota_formatted || 'Lưu trữ';

  const items = [
    { id: 'all', label: 'Tất cả', icon: Images },
    { id: 'photos', label: 'Ảnh', icon: ImageIcon },
    { id: 'videos', label: 'Video', icon: Film },
    { id: 'documents', label: 'Tài liệu', icon: FileText },
    { id: 'trash', label: 'Thùng rác', icon: Trash2, count: storageMetrics?.trash_count },
    { id: 'storage', label: quotaLabel, icon: HardDrive }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 px-1 py-1.5 flex items-center justify-around safe-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
              isActive ? 'text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 truncate max-w-[55px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
