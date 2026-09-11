import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  ShieldCheck, 
  HardDrive, 
  Database, 
  Sparkles,
  ArrowRight,
  AlertCircle,
  Settings,
  Lock,
  ExternalLink
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { apiFetch } from '../config/api.js';

export default function LoginView({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authConfig, setAuthConfig] = useState(null);
  const [checkingConfig, setCheckingConfig] = useState(true);

  // Tải cấu hình Firebase Auth trực tiếp từ file .env qua backend API
  useEffect(() => {
    apiFetch('/api/config/auth')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAuthConfig(data);
        }
      })
      .catch(err => {
        console.error('Lỗi khi lấy cấu hình Firebase từ máy chủ:', err);
      })
      .finally(() => {
        setCheckingConfig(false);
      });
  }, []);

  // Xử lý đăng nhập CHÍNH THỨC bằng Google Firebase Auth Popup
  const handleGoogleLogin = async () => {
    setError(null);

    const isFirebaseReady = authConfig?.firebase?.isConfigured;

    if (!isFirebaseReady) {
      setError('Hệ thống chưa được cấu hình khóa API Firebase trong file .env. Vui lòng kiểm tra lại file .env.');
      return;
    }

    try {
      setLoading(true);

      const firebaseConfig = authConfig.firebase;
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      // Buộc chọn tài khoản Google
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Mở cửa sổ popup đăng nhập Google chính thức của Firebase
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      // Lấy idToken thật do Google ký số
      const idToken = await fbUser.getIdToken();

      // Gửi idToken lên backend để Firebase Admin SDK verify chữ ký số từ máy chủ Google
      const res = await apiFetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Xác thực tài khoản Google thất bại tại máy chủ');
      }
    } catch (err) {
      console.error('Firebase Auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất xác thực');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Tên miền này chưa được thêm vào mục Authorized Domains trên Firebase Console');
      } else if (err.code === 'auth/configuration-not-found') {
        setError({
          type: 'firebase_not_enabled',
          title: 'Chưa kích hoạt Google Sign-In trên Firebase Console',
          message: `Dự án "${authConfig?.firebase?.projectId || 'luutru-20824'}" chưa được bật dịch vụ Google Sign-In.`,
          url: `https://console.firebase.google.com/project/${authConfig?.firebase?.projectId || 'luutru-20824'}/authentication/providers`
        });
      } else {
        setError(`Lỗi đăng nhập Google: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden">
      {/* Hiệu ứng nền chuyển sắc */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Thanh Header */}
      <header className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight text-white">CloudVault</span>
              <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                B2 Cloud
              </span>
            </div>
            <p className="text-xs text-slate-400">Kho lưu trữ đám mây đa nền tảng</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Bảo mật Private Tenant</span>
        </div>
      </header>

      {/* Khung đăng nhập chính */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          {/* Nhãn giới thiệu */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xác Thực Firebase Auth Thật 100%</span>
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
            Đăng Nhập CloudVault
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
            Kho lưu trữ đám mây dùng chung cho toàn hệ thống với bảo mật riêng tư tuyệt đối cho từng tài khoản Gmail thật.
          </p>

          {/* Hiển thị thông báo lỗi thường */}
          {error && typeof error === 'string' && (
            <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Hộp hướng dẫn trực quan khi chưa bật Google Sign-in */}
          {error && typeof error === 'object' && error.type === 'firebase_not_enabled' && (
            <div className="mb-6 p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-200">
              <div className="flex items-center gap-2 font-semibold text-amber-300 mb-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{error.title}</span>
              </div>
              <p className="mb-3 leading-relaxed text-slate-300">
                {error.message} Hãy thực hiện 3 bước sau trên trang Firebase Console (chỉ mất 30 giây):
              </p>
              <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-300 text-[11px] bg-slate-950/60 p-3.5 rounded-xl border border-amber-500/20">
                <li>Nhấp vào nút <strong>"Mở Cấu Hình Firebase Console"</strong> bên dưới.</li>
                <li>Bấm nút <strong>"Get started"</strong> (Bắt đầu) nếu bạn thấy nút này.</li>
                <li>Chọn nhà cung cấp <strong>Google</strong> ➔ Gạt công tắc sang <strong>Enable (Bật)</strong> ➔ Chọn email hỗ trợ ➔ Bấm <strong>Save (Lưu)</strong>.</li>
              </ol>
              <a
                href={error.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
              >
                <span>Mở Cấu Hình Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* DUY NHẤT MỘT NÚT ĐĂNG NHẬP GOOGLE POPUP CHÍNH THỨC */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || checkingConfig}
            className="w-full flex items-center justify-center gap-3 py-4 px-5 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl transition active:scale-[0.98] cursor-pointer group disabled:opacity-50"
          >
            {/* Logo Google chính thức */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google Popup'}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Cảnh báo cấu hình nếu chưa có API Key */}
          {!checkingConfig && !authConfig?.firebase?.isConfigured && (
            <div className="mt-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300 flex items-center gap-2">
              <Settings className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Cần cấu hình <strong>.env</strong>: Vui lòng điền các khóa API Firebase vào file <code>.env</code> để đăng nhập.
              </span>
            </div>
          )}

          {/* Các tính năng cốt lõi */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dung lượng tổng (Global Storage Pool) dùng chung</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Lock className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Bảo mật Private Tenant: Chỉ xem và quản lý file của chính bạn</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Database className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Lưu trữ đám mây Backblaze B2 chuẩn S3 API</span>
            </div>
          </div>
        </div>
      </main>

      {/* Chân trang */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-800/60 bg-slate-900/30">
        CloudVault 2.0 • Firebase Auth & Firebase Admin Verify • Backblaze B2 S3 Storage
      </footer>
    </div>
  );
}
