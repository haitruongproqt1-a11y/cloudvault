import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Image as ImageIcon, 
  Film, 
  FileText, 
  Trash2, 
  ShieldCheck, 
  RefreshCw, 
  FolderOpen, 
  CheckCircle2, 
  Download, 
  Cloud, 
  Database,
  Users,
  Lock,
  AlertTriangle,
  AlertCircle,
  Server
} from 'lucide-react';
import { apiFetch, getApiUrl } from '../config/api.js';

export default function StorageView({ 
  storageMetrics, 
  onRefreshStorage, 
  onEmptyTrash, 
  onViewMedia, 
  onDeleteMedia 
}) {
  const [largeFiles, setLargeFiles] = useState([]);
  const [loadingLargeFiles, setLoadingLargeFiles] = useState(false);
  const [isCleaningTrash, setIsCleaningTrash] = useState(false);

  useEffect(() => {
    fetchLargeFiles();
  }, []);

  const fetchLargeFiles = async () => {
    try {
      setLoadingLargeFiles(true);
      const res = await apiFetch('/api/storage/large-files');
      const data = await res.json();
      if (data.success) {
        const normalized = (data.items || []).map(item => ({
          ...item,
          url: getApiUrl(item.url),
          download_url: getApiUrl(item.download_url)
        }));
        setLargeFiles(normalized);
      }
    } catch (e) {
      console.error('Lỗi nạp tệp lớn:', e);
    } finally {
      setLoadingLargeFiles(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn toàn bộ tệp trong Thùng rác của bạn? Hành động này sẽ thu hồi ngay lập tức dung lượng lưu trữ.')) return;
    setIsCleaningTrash(true);
    await onEmptyTrash();
    await fetchLargeFiles();
    setIsCleaningTrash(false);
  };

  if (!storageMetrics) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
        Đang nạp thông tin dung lượng thực tế...
      </div>
    );
  }

  const cloud = storageMetrics.cloud || {};
  const b2 = cloud.b2 || { configured: false, status: 'Chưa kết nối / Vui lòng cấu hình .env' };
  const isB2Ready = Boolean(b2.configured);
  const quotaLabel = storageMetrics.quota_formatted || `${storageMetrics.max_storage_gb || 100} GB`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Banner: Global Storage Pool (Dung lượng thật từ biến môi trường MAX_STORAGE_GB) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-sky-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <HardDrive className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Kho Lưu Trữ {quotaLabel} (Global Storage Pool)
                  </h2>
                  <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Dùng Chung Hệ Thống
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Thanh đo hiển thị TỔNG dung lượng thực tế của tất cả người dùng cộng lại • Bảo mật Private Tenant riêng biệt
                </p>
              </div>
            </div>

            <button
              onClick={onRefreshStorage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Big Progress Bar: GLOBAL STORAGE POOL THỰC TẾ */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs sm:text-sm font-semibold">
              <span className="text-slate-200">
                Tổng toàn hệ thống đã dùng: <strong className="text-emerald-400">{storageMetrics.used_formatted}</strong> / {quotaLabel}
              </span>
              <span className="text-emerald-400 font-bold">
                {storageMetrics.used_percent}%
              </span>
            </div>

            <div className="w-full h-4 bg-slate-850 border border-slate-700/60 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${Math.min(100, Math.max(storageMetrics.used_bytes > 0 ? 1 : 0, storageMetrics.used_percent))}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Còn trống toàn hệ thống: <strong className="text-slate-200">{storageMetrics.remaining_formatted}</strong></span>
              <span>Hạn mức tổng: {quotaLabel} (Theo biến môi trường MAX_STORAGE_GB)</span>
            </div>
          </div>

          {/* Phần đóng góp cá nhân (Private Tenant info) */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>
                Phần bạn đang sử dụng: <strong className="text-emerald-400">{storageMetrics.user_size_formatted || '0 B'}</strong> ({storageMetrics.user_count || 0} tệp tin riêng)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Dữ liệu của bạn được cô lập an toàn, người khác không thể xem hoặc truy cập.
            </span>
          </div>
        </div>
      </div>

      {/* BẢNG TRẠNG THÁI KẾT NỐI DUY NHẤT: BACKBLAZE B2 S3 API */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lưu Trữ Đám Mây Backblaze B2 (S3 API)</h3>
              <p className="text-xs text-slate-400">Hạ tầng lưu trữ đám mây chính thức của hệ thống CloudVault</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 text-slate-300">
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span>S3 Protocol: us-west-004</span>
          </div>
        </div>

        {/* Khung chi tiết trạng thái Backblaze B2 */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isB2Ready 
            ? 'bg-slate-800/60 border-slate-700/80 shadow-lg' 
            : 'bg-rose-950/15 border-rose-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isB2Ready ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Dịch Vụ Đám Mây Backblaze B2</h4>
                <p className="text-xs text-slate-400">Kết nối trực tiếp qua chuẩn AWS S3 SDK</p>
              </div>
            </div>

            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
              isB2Ready 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isB2Ready ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {isB2Ready ? 'Đang Hoạt Động (Sẵn Sàng)' : 'Chưa kết nối / Vui lòng cấu hình .env'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-700/50 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-1">Tên Bucket:</span>
              <strong className="text-slate-200 font-mono break-all">
                {b2.bucket || 'luutrudammay2026'}
              </strong>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-1">S3 Endpoint:</span>
              <strong className="text-slate-200 font-mono break-all">
                {b2.endpoint || 's3.us-west-004.backblazeb2.com'}
              </strong>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-1">Cơ chế lưu trữ:</span>
              <span className="text-emerald-400 font-semibold">
                {isB2Ready ? 'Đám mây Backblaze B2 thật' : 'Cục bộ dự phòng (Local)'}
              </span>
            </div>
          </div>

          {!isB2Ready && (
            <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                Khóa API Backblaze B2 chưa được cấu hình hoặc chưa chính xác. Hệ thống đang tạm thời lưu trữ tệp trên đĩa cứng máy chủ (Local Storage).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Cards (Phân loại toàn hệ thống & Thùng rác riêng) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Photos Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Tổng ảnh hệ thống</span>
            <p className="text-base font-bold text-white">{storageMetrics.photo_size_formatted}</p>
            <p className="text-[11px] text-slate-400">{storageMetrics.photo_count} bức ảnh</p>
          </div>
        </div>

        {/* Videos Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Tổng video hệ thống</span>
            <p className="text-base font-bold text-white">{storageMetrics.video_size_formatted}</p>
            <p className="text-[11px] text-slate-400">{storageMetrics.video_count} đoạn video</p>
          </div>
        </div>

        {/* Documents & Files Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Tài liệu, ZIP, EXE</span>
            <p className="text-base font-bold text-white">
              {(storageMetrics.doc_size || 0) + (storageMetrics.other_size || 0) > 0 
                ? storageMetrics.doc_size_formatted 
                : '0 B'}
            </p>
            <p className="text-[11px] text-slate-400">
              {(storageMetrics.doc_count || 0) + (storageMetrics.other_count || 0)} tệp tin
            </p>
          </div>
        </div>

        {/* User Trash Card (Thùng rác riêng của bạn) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Thùng rác của bạn</span>
              <p className="text-base font-bold text-white">{storageMetrics.trash_size_formatted || '0 B'}</p>
              <p className="text-[11px] text-slate-400">{storageMetrics.trash_count || 0} tệp rác</p>
            </div>
          </div>
          {storageMetrics.trash_count > 0 && (
            <button
              onClick={handleEmptyTrash}
              disabled={isCleaningTrash}
              className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium transition"
              title="Xóa vĩnh viễn thùng rác để giải phóng dung lượng"
            >
              {isCleaningTrash ? 'Đang dọn...' : 'Dọn rác'}
            </button>
          )}
        </div>
      </div>

      {/* Top Largest Files của người dùng hiện tại */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Tệp Lớn Nhất Của Bạn (Private Tenant)</h3>
            <p className="text-xs text-slate-400">Quản lý các video, tệp nén hoặc tài liệu nặng thuộc sở hữu của bạn</p>
          </div>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            Top tệp của bạn
          </span>
        </div>

        {loadingLargeFiles ? (
          <div className="py-8 text-center text-slate-400 text-xs">Đang quét tệp...</div>
        ) : largeFiles.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Bạn chưa có tệp nào trong kho lưu trữ</div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {largeFiles.map((file) => (
              <div 
                key={file.id} 
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl transition"
              >
                <div 
                  onClick={() => onViewMedia(file)}
                  className="flex items-center gap-3 truncate cursor-pointer flex-1"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    file.category === 'video' ? 'bg-sky-500/20 text-sky-400' :
                    file.category === 'photo' ? 'bg-emerald-500/20 text-emerald-400' :
                    file.category === 'archive' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {file.category === 'video' ? <Film className="w-4 h-4" /> :
                     file.category === 'photo' ? <ImageIcon className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">{file.original_name}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(file.created_at).toLocaleDateString('vi-VN')} • Nguồn: <span className="uppercase text-emerald-400">{file.storage_backend || 'b2'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {file.size_formatted}
                  </span>
                  <a
                    href={file.download_url || getApiUrl(`/api/media/${file.id}/download`)}
                    download={file.original_name}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Tải về"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm(`Chuyển ${file.original_name} (${file.size_formatted}) vào thùng rác?`)) {
                        onDeleteMedia(file.id, false);
                        setLargeFiles(prev => prev.filter(f => f.id !== file.id));
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Xóa để giải phóng bộ nhớ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide: Global Pool & Private Tenant */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            Quy Định Vận Hành Dung Lượng & Bảo Mật
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              1. Global Storage Pool ({quotaLabel} Chung)
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Kho lưu trữ {quotaLabel} được phân bổ dùng chung cho toàn bộ thành viên trong hệ thống. Khi bất kỳ ai tải tệp lên, thanh đo tổng dung lượng sẽ cùng tăng lên và hiển thị đồng bộ cho tất cả mọi người.
            </p>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
            <h4 className="font-bold text-sky-400 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4" />
              2. Cô Lập Dữ Liệu Riêng Tư (Private Tenant)
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Mỗi tài khoản Gmail sau khi xác thực chỉ có thể nhìn thấy, tải về và quản lý các tệp do chính mình tải lên. Hệ thống từ chối mọi yêu cầu truy cập trái phép vào tệp của người khác.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
