import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Wifi, 
  Copy, 
  Check, 
  Globe, 
  Share2, 
  PlusSquare, 
  ExternalLink,
  ShieldCheck 
} from 'lucide-react';
import { apiFetch } from '../config/api.js';

export default function MobileConnectModal({ onClose }) {
  const [connectInfo, setConnectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch('/api/network/connect-info')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConnectInfo(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching connect info:', err);
        setLoading(false);
      });
  }, []);

  const handleCopyLink = () => {
    if (!connectInfo?.primaryUrl) return;
    navigator.clipboard.writeText(connectInfo.primaryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Kết Nối Điện Thoại (Mobile)</h3>
              <p className="text-xs text-slate-400">Dùng đồng thời trên cả iPhone và Android</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Đang tạo mã QR kết nối...
            </div>
          ) : connectInfo ? (
            <>
              {/* QR Code Card */}
              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-inner mx-auto max-w-xs">
                {connectInfo.qrDataUrl && (
                  <img
                    src={connectInfo.qrDataUrl}
                    alt="QR Code kết nối Mobile"
                    className="w-56 h-56 object-contain"
                  />
                )}
                <p className="text-slate-800 text-[11px] font-semibold mt-2 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  Mở camera điện thoại quét mã này
                </p>
              </div>

              {/* URL & Copy button */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Hoặc truy cập trực tiếp bằng đường link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={connectInfo.primaryUrl}
                    className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Step Instructions */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Hướng dẫn cài đặt thành ứng dụng trên điện thoại (PWA):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* iOS Safari */}
                  <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5">
                    <p className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      Trên iPhone (Safari)
                    </p>
                    <ol className="text-slate-400 text-[11px] space-y-1 list-decimal list-inside leading-relaxed">
                      <li>Mở link bằng Safari</li>
                      <li>Bấm nút <strong>Chia sẻ (Share)</strong></li>
                      <li>Chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong></li>
                    </ol>
                  </div>

                  {/* Android Chrome */}
                  <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <PlusSquare className="w-3.5 h-3.5" />
                      Trên Android (Chrome)
                    </p>
                    <ol className="text-slate-400 text-[11px] space-y-1 list-decimal list-inside leading-relaxed">
                      <li>Mở link bằng Chrome</li>
                      <li>Bấm menu <strong>3 chấm</strong> ở góc</li>
                      <li>Chọn <strong>Cài đặt ứng dụng (Install app)</strong></li>
                    </ol>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dữ liệu truyền tải trực tiếp trong mạng nội bộ gia đình với tốc độ Wi-Fi tối đa.</span>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center text-rose-400 text-xs">
              Không thể lấy thông tin IP mạng. Vui lòng kiểm tra lại kết nối Wi-Fi của máy tính.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
