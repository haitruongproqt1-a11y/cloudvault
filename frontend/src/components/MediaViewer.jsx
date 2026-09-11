import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Trash2, 
  Star, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText,
  Archive,
  Music,
  Cpu,
  File,
  ShieldCheck,
  Cloud
} from 'lucide-react';

export default function MediaViewer({ 
  media, 
  allMedia, 
  onClose, 
  onToggleFavorite, 
  onDeleteMedia 
}) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    return allMedia.findIndex(m => m.id === media.id);
  });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const videoRef = useRef(null);

  const currentItem = allMedia[currentIndex] || media;
  const ext = currentItem.original_name ? currentItem.original_name.split('.').pop().toUpperCase() : 'FILE';
  const isPhoto = currentItem.category === 'photo';
  const isVideo = currentItem.category === 'video';
  const isAudio = currentItem.category === 'audio';
  const isPdf = ext === 'PDF';

  // Reset zoom & rotation khi chuyển tệp
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [currentIndex]);

  // Điều hướng bằng bàn phím
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allMedia]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(allMedia.length - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const formattedDate = currentItem.created_at 
    ? new Date(currentItem.created_at).toLocaleString('vi-VN') 
    : 'Không rõ';

  const backendName = currentItem.storage_backend === 'r2' ? 'Cloudflare R2' :
                      currentItem.storage_backend === 'b2' ? 'Backblaze B2' : 'Ổ Cứng Máy Tính (Local)';

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent z-20">
        {/* File info */}
        <div className="flex items-center gap-3 truncate max-w-[50%]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                {currentItem.original_name}
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {ext}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {currentItem.size_formatted} • {formattedDate} • <span className="text-sky-400">{backendName}</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom controls cho ảnh */}
          {isPhoto && (
            <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1 backdrop-blur-md">
              <button 
                onClick={handleZoomIn} 
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={handleZoomOut} 
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button 
                onClick={handleRotate} 
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
                title="Xoay 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(currentItem.id)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-amber-400 backdrop-blur-md transition"
            title="Yêu thích"
          >
            <Star className={`w-4 h-4 ${currentItem.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {/* Direct download button */}
          <a
            href={currentItem.download_url}
            download={currentItem.original_name}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white backdrop-blur-md transition flex items-center gap-1.5 text-xs font-medium"
            title="Tải về máy chất lượng gốc"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Tải về máy</span>
          </a>

          {/* Delete to trash button */}
          <button
            onClick={() => {
              if (confirm('Bạn có muốn chuyển tệp này vào Thùng rác?')) {
                onDeleteMedia(currentItem.id, false);
                onClose();
              }
            }}
            className="p-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-400 hover:text-rose-200 backdrop-blur-md transition"
            title="Xóa vào thùng rác"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white backdrop-blur-md transition ml-2"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6">
        {/* Previous Button */}
        {allMedia.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition group"
            title="Tệp trước (Mũi tên trái)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Media Preview by Type */}
        <div className="w-full h-full flex items-center justify-center">
          {isPhoto ? (
            <div className="overflow-auto max-h-[82vh] max-w-full flex items-center justify-center">
              <img
                src={currentItem.url}
                alt={currentItem.original_name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          ) : isVideo ? (
            <video
              ref={videoRef}
              key={currentItem.id}
              src={currentItem.url}
              controls
              autoPlay
              playsInline
              className="max-h-[82vh] max-w-full rounded-xl shadow-2xl object-contain"
            />
          ) : isAudio ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full text-center space-y-4 shadow-2xl">
              <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-3xl mx-auto flex items-center justify-center">
                <Music className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-white truncate">{currentItem.original_name}</h4>
              <audio src={currentItem.url} controls autoPlay className="w-full" />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full max-h-[82vh] max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
              <iframe
                src={currentItem.url}
                title={currentItem.original_name}
                className="w-full flex-1 border-0"
              />
            </div>
          ) : (
            /* Card chi tiết cho các tệp khác (DOCX, ZIP, EXE, ISO...) */
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl mx-auto flex items-center justify-center text-slate-300 border border-slate-700">
                {currentItem.category === 'archive' ? <Archive className="w-10 h-10 text-purple-400" /> :
                 currentItem.category === 'executable' ? <Cpu className="w-10 h-10 text-cyan-400" /> :
                 currentItem.category === 'document' ? <FileText className="w-10 h-10 text-blue-400" /> :
                 <File className="w-10 h-10 text-slate-400" />}
              </div>

              <div>
                <h4 className="text-base font-bold text-white break-words">{currentItem.original_name}</h4>
                <p className="text-xs text-slate-400 mt-1">{currentItem.size_formatted} • Định dạng {ext}</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs text-slate-300 space-y-1.5 text-left font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nguồn lưu trữ:</span>
                  <span className="text-emerald-400 font-bold uppercase">{currentItem.storage_backend || 'local'}</span>
                </div>
                {currentItem.sha256 && (
                  <div className="flex justify-between truncate">
                    <span className="text-slate-400">SHA-256:</span>
                    <span className="text-slate-200 truncate ml-2" title={currentItem.sha256}>{currentItem.sha256.substring(0, 16)}...</span>
                  </div>
                )}
              </div>

              <a
                href={currentItem.download_url}
                download={currentItem.original_name}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-emerald-600/30 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Tải tệp này về máy</span>
              </a>
            </div>
          )}
        </div>

        {/* Next Button */}
        {allMedia.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition group"
            title="Tệp sau (Mũi tên phải)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Bottom Counter & Details */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-t from-black/80 to-transparent z-20 text-xs text-slate-400">
        <div>
          {allMedia.length > 0 && (
            <span>
              {currentIndex + 1} / {allMedia.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">
            Định dạng: <strong className="text-slate-200">{currentItem.mime_type}</strong>
          </span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <Cloud className="w-3.5 h-3.5" />
            <span>{backendName}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
