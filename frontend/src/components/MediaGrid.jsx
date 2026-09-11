import React, { useState, useMemo } from 'react';
import { 
  Play, 
  Star, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Archive, 
  X, 
  UploadCloud,
  Film,
  Image as ImageIcon,
  FileText,
  FileCode,
  Music,
  Cpu,
  File,
  Cloud
} from 'lucide-react';
import { apiFetch, getApiUrl } from '../config/api.js';

// Định dạng ngày hiển thị theo nhóm
function formatDateHeader(isoDateStr) {
  if (!isoDateStr) return 'Khác';
  const date = new Date(isoDateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hôm nay';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  }

  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
}

// Trả về biểu tượng và màu sắc phù hợp cho từng định dạng tệp tin
function renderFileThumbnail(item) {
  const ext = item.original_name ? item.original_name.split('.').pop().toUpperCase() : 'FILE';

  if (item.category === 'photo') {
    return (
      <img
        src={item.url}
        alt={item.original_name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  if (item.category === 'video') {
    return (
      <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
        <video
          src={item.url}
          className="w-full h-full object-cover pointer-events-none"
          preload="metadata"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:scale-110 transition-transform">
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </div>
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] text-white font-medium">
          <Film className="w-3 h-3 text-sky-400" />
          <span>VIDEO</span>
        </span>
      </div>
    );
  }

  if (item.category === 'document') {
    const isPdf = ext === 'PDF';
    const isWord = ['DOC', 'DOCX'].includes(ext);
    const isExcel = ['XLS', 'XLSX', 'CSV'].includes(ext);
    const colorClass = isPdf ? 'from-rose-600/30 to-red-950 text-rose-400 border-rose-500/30' :
                       isWord ? 'from-blue-600/30 to-sky-950 text-blue-400 border-blue-500/30' :
                       isExcel ? 'from-emerald-600/30 to-teal-950 text-emerald-400 border-emerald-500/30' :
                       'from-amber-600/30 to-amber-950 text-amber-400 border-amber-500/30';

    return (
      <div className={`w-full h-full bg-gradient-to-br ${colorClass} border p-4 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-102`}>
        <FileText className="w-12 h-12 mb-2 stroke-[1.5]" />
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm tracking-wider uppercase">
          {ext}
        </span>
        <p className="text-[11px] font-medium text-slate-300 truncate w-full mt-2 px-1">
          {item.original_name}
        </p>
      </div>
    );
  }

  if (item.category === 'archive') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-indigo-950 border border-purple-500/30 p-4 flex flex-col items-center justify-center text-center text-purple-400 transition-transform group-hover:scale-102">
        <Archive className="w-12 h-12 mb-2 stroke-[1.5]" />
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm tracking-wider uppercase text-purple-300">
          {ext}
        </span>
        <p className="text-[11px] font-medium text-slate-300 truncate w-full mt-2 px-1">
          {item.original_name}
        </p>
      </div>
    );
  }

  if (item.category === 'audio') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-600/30 to-orange-950 border border-amber-500/30 p-4 flex flex-col items-center justify-center text-center text-amber-400 transition-transform group-hover:scale-102">
        <Music className="w-12 h-12 mb-2 stroke-[1.5]" />
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm tracking-wider uppercase text-amber-300">
          {ext}
        </span>
        <p className="text-[11px] font-medium text-slate-300 truncate w-full mt-2 px-1">
          {item.original_name}
        </p>
      </div>
    );
  }

  if (item.category === 'executable' || item.category === 'code') {
    const Icon = item.category === 'executable' ? Cpu : FileCode;
    return (
      <div className="w-full h-full bg-gradient-to-br from-cyan-600/30 to-slate-950 border border-cyan-500/30 p-4 flex flex-col items-center justify-center text-center text-cyan-400 transition-transform group-hover:scale-102">
        <Icon className="w-12 h-12 mb-2 stroke-[1.5]" />
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm tracking-wider uppercase text-cyan-300">
          {ext}
        </span>
        <p className="text-[11px] font-medium text-slate-300 truncate w-full mt-2 px-1">
          {item.original_name}
        </p>
      </div>
    );
  }

  // Generic other file
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-750 to-slate-900 border border-slate-700/60 p-4 flex flex-col items-center justify-center text-center text-slate-300 transition-transform group-hover:scale-102">
      <File className="w-12 h-12 mb-2 text-slate-400 stroke-[1.5]" />
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm tracking-wider uppercase text-slate-300">
        {ext}
      </span>
      <p className="text-[11px] font-medium text-slate-300 truncate w-full mt-2 px-1">
        {item.original_name}
      </p>
    </div>
  );
}

export default function MediaGrid({ 
  items, 
  loading, 
  onViewMedia, 
  onToggleFavorite, 
  onDeleteMedia, 
  onOpenUpload 
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);

  // Nhóm tệp theo ngày tháng
  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const header = formatDateHeader(item.created_at);
      if (!groups[header]) groups[header] = [];
      groups[header].push(item);
    });
    return groups;
  }, [items]);

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Tải về hàng loạt dạng ZIP
  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsDownloadingBatch(true);
      const res = await apiFetch('/api/media/batch-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      if (!res.ok) throw new Error('Download batch failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloudvault_selected_${selectedIds.size}_files.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Lỗi tải về hàng loạt: ' + err.message);
    } finally {
      setIsDownloadingBatch(false);
    }
  };

  // Xóa các tệp đã chọn vào thùng rác
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Bạn có chắc muốn chuyển ${selectedIds.size} tệp vào Thùng rác không?`)) return;

    for (const id of selectedIds) {
      await onDeleteMedia(id, false);
    }
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Đang tải kho tệp tin...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[62vh] text-center px-4 py-8">
        <div className="relative mb-5">
          {/* Vòng hào quang phát sáng nhẹ */}
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
            <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 animate-pulse" />
          </div>
        </div>

        <h3 className="text-base sm:text-xl font-bold text-white mb-1.5 tracking-tight">
          Chưa có tệp nào trong mục này
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs sm:max-w-md mb-5 leading-relaxed">
          Kho lưu trữ 10 GB đám mây Backblaze B2. Hỗ trợ mọi định dạng: Ảnh, Video 4K, Tài liệu PDF/Office, Tệp nén ZIP/APK.
        </p>

        {/* Các chip định dạng hỗ trợ */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6 max-w-xs">
          {['Ảnh', 'Video', 'PDF', 'Word', 'Excel', 'ZIP', 'APK'].map((tag) => (
            <span key={tag} className="text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Tải tệp tin lên ngay</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* Floating Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-slate-700/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-xs sm:text-sm font-semibold text-emerald-400">
            Đã chọn {selectedIds.size} tệp
          </span>
          <div className="h-4 w-px bg-slate-700" />

          {/* Batch Download Button */}
          <button
            onClick={handleBatchDownload}
            disabled={isDownloadingBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isDownloadingBatch ? 'Đang nén...' : 'Tải về ZIP'}</span>
          </button>

          {/* Batch Delete Button */}
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa vào thùng rác</span>
          </button>

          {/* Deselect All */}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Bỏ chọn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid rendered by date group */}
      {Object.entries(groupedItems).map(([dateHeader, groupItems]) => (
        <div key={dateHeader} className="mb-8">
          <div className="sticky top-[58px] z-10 py-2.5 bg-slate-950/90 backdrop-blur-sm flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-200 tracking-wide">
              {dateHeader}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {groupItems.length} tệp
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
            {groupItems.map((item) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => onViewMedia(item)}
                  className={`group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border cursor-pointer select-none transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/10 ${
                    isSelected 
                      ? 'ring-2 ring-emerald-500 border-emerald-500 scale-[0.98]' 
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Media Content - Dynamic Icon or Photo/Video */}
                  {renderFileThumbnail(item)}

                  {/* Top-left Cloud Storage Badge (R2, B2, Local) */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                    {/* Select Checkbox */}
                    <div
                      onClick={(e) => toggleSelect(item.id, e)}
                      className={`transition-all ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-slate-950" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/80 hover:text-white" />
                      )}
                    </div>

                    {/* Cloud storage badge */}
                    {item.storage_backend && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wider ${
                        item.storage_backend === 'r2' 
                          ? 'bg-amber-500/80 text-white' 
                          : item.storage_backend === 'b2' 
                          ? 'bg-sky-500/80 text-white' 
                          : 'bg-slate-800/80 text-slate-300'
                      }`}>
                        {item.storage_backend}
                      </span>
                    )}
                  </div>

                  {/* Gradient overlay: Luôn hiện nhẹ ở đáy trên mobile, trên desktop hiện khi hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />

                  {/* Top-right Favorite Star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className={`absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-md bg-black/40 transition-all active:scale-90 ${
                      item.is_favorite 
                        ? 'text-amber-400 opacity-100' 
                        : 'text-white/70 hover:text-amber-300 opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
                    }`}
                    title={item.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                  >
                    <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${item.is_favorite ? 'fill-amber-400' : ''}`} />
                  </button>

                  {/* Bottom info bar - Tải về & Xóa */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                    <a
                      href={item.download_url}
                      download={item.original_name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-slate-800 text-white/90 hover:text-white backdrop-blur-md transition active:scale-90"
                      title="Tải về máy"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMedia(item.id, false);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-900/70 text-white/90 hover:text-rose-400 backdrop-blur-md transition active:scale-90"
                      title="Chuyển vào thùng rác"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* File size & title indicator: Hiển thị tên file và kích thước rõ ràng trên mobile */}
                  <div className="absolute bottom-2 left-2.5 right-16 truncate text-[11px] text-slate-200 pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity drop-shadow-md">
                    <p className="truncate font-semibold text-white">{item.original_name}</p>
                    <p className="text-[10px] text-emerald-400/90 font-mono">{item.size_formatted}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
