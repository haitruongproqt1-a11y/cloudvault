import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  File, 
  AlertCircle, 
  Camera, 
  Trash2,
  Film,
  Image as ImageIcon,
  FileText,
  Archive,
  Music,
  Cpu,
  Cloud
} from 'lucide-react';
import { getApiUrl } from '../config/api.js';

function getFileIcon(filename = '') {
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp', 'svg'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'flv'].includes(ext)) {
    return <Film className="w-4 h-4 text-sky-400 shrink-0" />;
  }
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) {
    return <FileText className="w-4 h-4 text-rose-400 shrink-0" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'iso'].includes(ext)) {
    return <Archive className="w-4 h-4 text-purple-400 shrink-0" />;
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return <Music className="w-4 h-4 text-amber-400 shrink-0" />;
  }
  if (['exe', 'msi', 'apk', 'dmg', 'bat'].includes(ext)) {
    return <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />;
  }
  return <File className="w-4 h-4 text-slate-400 shrink-0" />;
}

export default function UploadModal({ onClose, onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      size_formatted: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    const formData = new FormData();
    selectedFiles.forEach(item => {
      formData.append('files', item.file);
    });

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', getApiUrl('/api/upload'));
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            onUploadSuccess(response.uploaded);
            onClose();
          } else {
            setErrorMessage(response.error || 'Lỗi khi tải lên');
          }
        } else {
          setErrorMessage(`Máy chủ phản hồi lỗi: ${xhr.status}`);
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setErrorMessage('Mất kết nối mạng đến máy chủ');
        setIsUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      setErrorMessage(err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tải Lên Kho Lưu Trữ Đám Mây</h3>
              <p className="text-xs text-slate-400">Hỗ trợ mọi định dạng: Ảnh, Video, PDF, DOCX, ZIP, EXE...</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
            }`}
          >
            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-slate-200 mb-1">
              Kéo và thả bất kỳ tệp tin nào vào đây
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Tự động đồng bộ đám mây Backblaze B2 • Tối đa 10GB / tệp
            </p>

            {/* Hidden Inputs (Không giới hạn loại tệp) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              capture="environment"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-sm"
              >
                Chọn tệp từ thiết bị
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 rounded-xl text-xs sm:text-sm font-medium transition"
              >
                <Camera className="w-4 h-4" />
                <span>Máy ảnh / Camera</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selected File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Danh sách tải lên ({selectedFiles.length} tệp)</span>
                {!isUploading && (
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-rose-400 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                      {getFileIcon(item.name)}
                      <span className="truncate text-slate-200">{item.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({item.size_formatted})</span>
                    </div>

                    {!isUploading && (
                      <button
                        onClick={() => removeFile(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  <span>Đang tải lên và đồng bộ đám mây...</span>
                </span>
                <span className="font-bold text-emerald-400">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-slate-400 hover:text-white text-xs sm:text-sm font-medium transition disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            onClick={startUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? `Đang xử lý (${uploadProgress}%)` : `Tải lên ${selectedFiles.length} tệp`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
