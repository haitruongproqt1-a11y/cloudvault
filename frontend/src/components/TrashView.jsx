import React from 'react';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Film, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

export default function TrashView({ 
  trashItems, 
  onRestore, 
  onPermanentDelete, 
  onEmptyTrash, 
  loading 
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
        <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-3" />
        <p className="text-xs">Đang tải danh sách thùng rác...</p>
      </div>
    );
  }

  if (trashItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-3 border border-slate-700/60">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">Thùng rác đang trống</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Không có tệp nào bị xóa. Khi bạn xóa ảnh hoặc video, chúng sẽ nằm tại đây trước khi bạn quyết định xóa vĩnh viễn để thu hồi dung lượng.
        </p>
      </div>
    );
  }

  const totalTrashBytes = trashItems.reduce((acc, item) => acc + item.size, 0);
  const totalTrashFormatted = (totalTrashBytes / (1024 * 1024)).toFixed(1) + ' MB';

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20">
      {/* Top Banner */}
      <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Thùng Rác ({trashItems.length} tệp)</h3>
            <p className="text-xs text-rose-200/70">
              Tổng dung lượng rác có thể giải phóng: <strong className="text-white">{totalTrashFormatted}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm(`Bạn có chắc muốn xóa vĩnh viễn TOÀN BỘ ${trashItems.length} tệp trong thùng rác không? Dung lượng sẽ được thu hồi ngay lập tức.`)) {
              onEmptyTrash();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30 transition active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>Dọn sạch thùng rác</span>
        </button>
      </div>

      {/* Trash list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
        {trashItems.map((item) => (
          <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition">
            <div className="flex items-center gap-3 truncate max-w-[60%]">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                item.category === 'video' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {item.category === 'video' ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{item.original_name}</p>
                <p className="text-[10px] text-slate-400">
                  {item.size_formatted} • Xóa lúc: {item.deleted_at ? new Date(item.deleted_at).toLocaleString('vi-VN') : 'Gần đây'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRestore(item.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
                title="Khôi phục lại tệp"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Khôi phục</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Xóa vĩnh viễn tệp "${item.original_name}" khỏi đĩa cứng?`)) {
                    onPermanentDelete(item.id);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-xl text-xs font-medium transition"
                title="Xóa vĩnh viễn ngay lập tức"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Xóa vĩnh viễn</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
