import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import MediaGrid from './components/MediaGrid';
import MediaViewer from './components/MediaViewer';
import UploadModal from './components/UploadModal';
import StorageView from './components/StorageView';
import TrashView from './components/TrashView';
import MobileConnectModal from './components/MobileConnectModal';
import LoginView from './components/LoginView';
import { apiFetch, getApiUrl } from './config/api.js';

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGoogleAuthReady, setIsGoogleAuthReady] = useState(false);

  // App state
  const [currentTab, setCurrentTab] = useState('all'); // all, photos, videos, documents, favorites, trash, storage
  const [mediaList, setMediaList] = useState([]);
  const [trashList, setTrashList] = useState([]);
  const [storageMetrics, setStorageMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trashLoading, setTrashLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [viewingMedia, setViewingMedia] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Kiểm tra trạng thái đăng nhập khi mở trang
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const res = await apiFetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
      setIsGoogleAuthReady(Boolean(data.isGoogleAuthReady));
    } catch (err) {
      console.error('Lỗi kiểm tra xác thực:', err);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setMediaList([]);
      setTrashList([]);
      setStorageMetrics(null);
    } catch (err) {
      console.error('Đăng xuất thất bại:', err);
    }
  };

  // 2. Tải số liệu thống kê dung lượng của người dùng
  const fetchStorageMetrics = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/storage/status');
      if (res.status === 401) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStorageMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error fetching storage metrics:', err);
    }
  }, [user]);

  // 3. Tải danh sách tệp tin
  const fetchMedia = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentTab === 'photos') params.append('category', 'photo');
      if (currentTab === 'videos') params.append('category', 'video');
      if (currentTab === 'documents') params.append('category', 'document');
      if (currentTab === 'favorites') params.append('favorite', '1');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('is_deleted', '0');

      const res = await apiFetch(`/api/media?${params.toString()}`);
      if (res.status === 401) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.success) {
        // Chuẩn hóa URL cho cả môi trường Web và Ứng dụng Di Động (Capacitor)
        const normalizedItems = (data.items || []).map(item => ({
          ...item,
          url: getApiUrl(item.url),
          download_url: getApiUrl(item.download_url)
        }));
        setMediaList(normalizedItems);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentTab, searchQuery]);

  // 4. Tải danh sách Thùng rác
  const fetchTrash = useCallback(async () => {
    if (!user) return;
    try {
      setTrashLoading(true);
      const res = await apiFetch('/api/media?is_deleted=1');
      if (res.status === 401) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.success) {
        const normalizedItems = (data.items || []).map(item => ({
          ...item,
          url: getApiUrl(item.url),
          download_url: getApiUrl(item.download_url)
        }));
        setTrashList(normalizedItems);
      }
    } catch (err) {
      console.error('Error fetching trash:', err);
    } finally {
      setTrashLoading(false);
    }
  }, [user]);

  // Refetch dữ liệu khi thay đổi tab hoặc user
  useEffect(() => {
    if (!user) return;
    fetchStorageMetrics();
    if (currentTab === 'trash') {
      fetchTrash();
    } else if (currentTab !== 'storage') {
      fetchMedia();
    }
  }, [user, currentTab, searchQuery, fetchMedia, fetchTrash, fetchStorageMetrics]);

  // Bật/tắt yêu thích
  const handleToggleFavorite = async (id) => {
    try {
      const res = await apiFetch(`/api/media/${id}/favorite`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMediaList(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, is_favorite: data.is_favorite };
          }
          return item;
        }));
        if (viewingMedia && viewingMedia.id === id) {
          setViewingMedia(prev => ({ ...prev, is_favorite: data.is_favorite }));
        }
      }
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  };

  // Xóa tệp (chuyển vào thùng rác)
  const handleDeleteMedia = async (id, prompt = true) => {
    try {
      const res = await apiFetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaList(prev => prev.filter(item => item.id !== id));
        fetchStorageMetrics();
        if (viewingMedia && viewingMedia.id === id) {
          setViewingMedia(null);
        }
      }
    } catch (err) {
      console.error('Delete media failed:', err);
    }
  };

  // Khôi phục từ thùng rác
  const handleRestoreMedia = async (id) => {
    try {
      const res = await apiFetch(`/api/media/${id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTrashList(prev => prev.filter(item => item.id !== id));
        fetchStorageMetrics();
      }
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  // Xóa vĩnh viễn
  const handlePermanentDelete = async (id) => {
    try {
      const res = await apiFetch(`/api/media/${id}/permanent`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTrashList(prev => prev.filter(item => item.id !== id));
        fetchStorageMetrics();
      }
    } catch (err) {
      console.error('Permanent delete failed:', err);
    }
  };

  // Dọn sạch thùng rác
  const handleEmptyTrash = async () => {
    try {
      const res = await apiFetch('/api/trash/empty', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTrashList([]);
        fetchStorageMetrics();
      }
    } catch (err) {
      console.error('Empty trash failed:', err);
    }
  };

  // Sau khi tải lên thành công
  const handleUploadSuccess = (newUploadedItems) => {
    fetchMedia();
    fetchStorageMetrics();
  };

  // Màn hình chờ kiểm tra đăng nhập
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Đang kiểm tra bảo mật tài khoản...</p>
      </div>
    );
  }

  // Nếu chưa đăng nhập: Hiển thị màn hình đăng nhập Google OAuth
  if (!user) {
    return (
      <LoginView
        onLoginSuccess={(loggedUser) => setUser(loggedUser)}
        isConfigured={isGoogleAuthReady}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        storageMetrics={storageMetrics}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
        onOpenStorage={() => setCurrentTab('storage')}
        toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          storageMetrics={storageMetrics}
          onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-full">
          {currentTab === 'storage' ? (
            <StorageView
              storageMetrics={storageMetrics}
              onRefreshStorage={fetchStorageMetrics}
              onEmptyTrash={handleEmptyTrash}
              onViewMedia={(item) => setViewingMedia(item)}
              onDeleteMedia={handleDeleteMedia}
            />
          ) : currentTab === 'trash' ? (
            <TrashView
              trashItems={trashList}
              onRestore={handleRestoreMedia}
              onPermanentDelete={handlePermanentDelete}
              onEmptyTrash={handleEmptyTrash}
              loading={trashLoading}
            />
          ) : (
            <MediaGrid
              items={mediaList}
              loading={loading}
              onViewMedia={(item) => setViewingMedia(item)}
              onToggleFavorite={handleToggleFavorite}
              onDeleteMedia={handleDeleteMedia}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        storageMetrics={storageMetrics}
      />

      {/* Fullscreen Lightbox Media Viewer */}
      {viewingMedia && (
        <MediaViewer
          media={viewingMedia}
          allMedia={mediaList}
          onClose={() => setViewingMedia(null)}
          onToggleFavorite={handleToggleFavorite}
          onDeleteMedia={handleDeleteMedia}
        />
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Mobile QR Connect Modal */}
      {isMobileConnectOpen && (
        <MobileConnectModal
          onClose={() => setIsMobileConnectOpen(false)}
        />
      )}
    </div>
  );
}
